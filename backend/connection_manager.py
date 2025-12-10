import json
import asyncio
import logging
import websockets
from fastapi import WebSocket
from config import CONFIG, VOICE_SETTINGS
from voice_rag_engine import VoiceRAGEngine
from openai import AzureOpenAI

logger = logging.getLogger("voice-agent")
logging.basicConfig(level=logging.INFO)

# Azure OpenAI Chat Client for Summary Generation
chat_client = AzureOpenAI(
    azure_endpoint=CONFIG["azure"]["openai"]["api_base"],
    api_key=CONFIG["azure"]["openai"]["api_key"],
    api_version=CONFIG["azure"]["openai"]["llm"].get("version", "2024-08-01-preview")
)

def get_azure_realtime_url():
    """Constructs the WSS URL for Azure Realtime"""
    base = CONFIG["azure"]["openai"]["api_base"].rstrip("/").replace("https://", "wss://")
    deployment = VOICE_SETTINGS.get("deployment_name", "gpt-4o-realtime-preview")
    api_version = VOICE_SETTINGS.get("api_version", "2024-10-01-preview")
    url = f"{base}/openai/realtime?api-version={api_version}&deployment={deployment}"
    return url

class RealtimeSessionManager:
    def __init__(self, client_ws: WebSocket, kb_id: str):
        self.client_ws = client_ws
        self.azure_ws = None
        self.kb_id = kb_id
        self.rag = VoiceRAGEngine(kb_id) if kb_id != "default" else None
        self.transcript_history = []  # List of {"role": "user"|"assistant", "content": "..."}

        # Current Settings State
        self.current_settings = {
            "voice_name": VOICE_SETTINGS.get("voice_name", "shimmer"),
            "agent_tone": VOICE_SETTINGS.get("agent_tone", "warm"),
            "speaking_rate": VOICE_SETTINGS.get("speaking_rate", "normal pace"),
            "emotion_style": VOICE_SETTINGS.get("emotion_style", "empathetic")
        }

        # 2. Configure Session
        self.session_config = {
            "instructions": self._build_instructions(),
            "voice": self.current_settings["voice_name"],
            "input_audio_transcription": {
                "model": "whisper-1"
            },
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.5,
                "prefix_padding_ms": 300,
                "silence_duration_ms": 500
            },
            "tool_choice": "auto",
            "temperature": 0.8,
        }

        # Add tools if a KB is selected
        if self.kb_id != "default":
            self.session_config["tools"] = [
                {
                    "type": "function",
                    "name": "query_knowledge_base",
                    "description": "Search the internal knowledge base for facts.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query"}
                        },
                        "required": ["query"]
                    }
                }
            ]

    def _build_instructions(self):
        """Constructs the system instructions based on current settings."""
        return (
            f"{VOICE_SETTINGS.get('base_instructions', '')} "
            f"Speaking Style: Speak with a {self.current_settings['agent_tone']} tone. "
            f"Pace: Speak at a {self.current_settings['speaking_rate']}. "
            f"Emotion: Be {self.current_settings['emotion_style']}. "
            "IMPORTANT: Use the 'query_knowledge_base' tool to answer questions. "
            "If using the knowledge base, naturally weave the information into your spoken response."
        )

    async def update_session_settings(self, new_settings: dict):
        """Updates the active session with new voice/instruction settings."""
        # Update local state
        for key in self.current_settings:
            if key in new_settings:
                self.current_settings[key] = new_settings[key]
        
        # Build new config payload
        updated_instructions = self._build_instructions()
        update_payload = {
            "type": "session.update",
            "session": {
                "instructions": updated_instructions,
            }
        }
        
        # Only update voice if it changed (optimization)
        if "voice_name" in new_settings:
            update_payload["session"]["voice"] = new_settings["voice_name"]

        logger.info(f"Updating session settings: {new_settings}")
        await self.send_to_azure(update_payload)

        # Add tools only if a KB is selected
        if self.kb_id != "default":
            self.session_config["tools"] = [
                {
                    "type": "function",
                    "name": "query_knowledge_base",
                    "description": "Search the internal knowledge base for facts.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query"}
                        },
                        "required": ["query"]
                    }
                }
            ]

    async def connect_azure(self):
        """Establishes connection to Azure Realtime API"""
        try:
            url = get_azure_realtime_url()
            headers = {"api-key": CONFIG["azure"]["openai"]["api_key"]}
            self.azure_ws = await websockets.connect(url, additional_headers=headers)
            
            # Send Initial Session Config
            await self.send_to_azure({
                "type": "session.update",
                "session": self.session_config
            })
            logger.info(f"Connected to Azure for KB: {self.kb_id}")
        except Exception as e:
            logger.error(f"Failed to connect to Azure: {e}")
            await self.client_ws.close(code=1011)

    async def send_to_azure(self, payload: dict):
        if self.azure_ws:
            await self.azure_ws.send(json.dumps(payload))

    async def send_to_client(self, payload: dict):
        if self.client_ws.client_state.name == "CONNECTED":
            await self.client_ws.send_json(payload)

    async def handle_rag_tool(self, call_id: str, args: dict):
        """Executes RAG search and returns result to Azure"""
        try:
            query = args.get("query", "")
            logger.info(f"Handling RAG tool call: {query}")
            
            # UI Update: "Thinking..."
            await self.send_to_client({"type": "rag_status", "status": "searching", "query": query})
            
            # Perform Search
            if self.rag:
                context, citations = await self.rag.search(query)
            else:
                context = "I don't have access to a knowledge base."
                citations = []
            
            logger.info(f"RAG Search result context length: {len(context)}")

            # UI Update: Show Citations (Grounding)
            if citations:
                await self.send_to_client({"type": "grounding", "citations": citations})
            else:
                await self.send_to_client({"type": "rag_status", "status": "no_results"})

            # Send Text Result back to Azure
            await self.send_to_azure({
                "type": "conversation.item.create",
                "item": {
                    "type": "function_call_output",
                    "call_id": call_id,
                    "output": context
                }
            })
            # Trigger response generation
            await self.send_to_azure({"type": "response.create"})
            
        except Exception as e:
            logger.exception(f"Error in handle_rag_tool: {e}")
            # Ensure we tell Azure something failed so it doesn't hang
            await self.send_to_azure({
                "type": "conversation.item.create",
                "item": {
                    "type": "function_call_output",
                    "call_id": call_id,
                    "output": "Error retrieving information."
                }
            })
            await self.send_to_azure({"type": "response.create"})

    async def generate_summary(self):
        """Generates a summary of the conversation using GPT-4o (Chat)"""
        if not self.transcript_history:
            return "No conversation history to summarize."

        transcript_text = "\n".join([f"{t['role'].title()}: {t['content']}" for t in self.transcript_history])
        
        try:
            response = chat_client.chat.completions.create(
                model=CONFIG["azure"]["openai"]["llm"]["deployment_name"],
                messages=[
                    {"role": "system", "content": "Summarize the following voice conversation. Format the output as Markdown with headers, key points, and action items."},
                    {"role": "user", "content": transcript_text}
                ],
                max_completion_tokens=1000
            )
            summary = response.choices[0].message.content
            return summary
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return "Failed to generate summary."

    async def process_azure_messages(self):
        """Reads events from Azure -> Sends to Client"""
        try:
            if not self.azure_ws:
                logger.error("Azure WebSocket is not connected.")
                return

            async for message in self.azure_ws:
                event = json.loads(message)
                event_type = event.get("type")

                # Debug: Log key events to diagnose silence
                if event_type in ["error", "input_audio_buffer.speech_started", "response.created", "rate_limits.updated", "response.function_call_arguments.done"]:
                    logger.info(f"Azure Event: {event_type} | Data: {str(event)[:200]}")

                # 1. Audio Delta (TTS Stream)
                if event_type == "response.audio.delta":
                    await self.send_to_client({
                        "type": "audio_delta",
                        "payload": event["delta"]
                    })

                # 2. User Transcript (STT) - Final
                elif event_type == "conversation.item.input_audio_transcription.completed":
                    transcript = event.get("transcript", "")
                    if transcript:
                        self.transcript_history.append({"role": "user", "content": transcript})
                        await self.send_to_client({
                            "type": "transcript",
                            "role": "user",
                            "text": transcript
                        })
                
                # 3. Assistant Transcript - Final (accumulated from deltas or done event)
                elif event_type == "response.done":
                    # Extract final output text if available in the response object
                    # Note: Realtime API structure can vary; we often reconstruct from deltas or check item.
                    # For simplicity, we might just rely on text deltas if enabled, but 'audio' mode 
                    # usually doesn't send text deltas unless requested.
                    # We can try to capture 'response.text.done' if mixed mode, but standard voice is audio-only.
                    # However, the `response.output` often contains the text transcript of what was spoken.
                    output_items = event.get("response", {}).get("output", [])
                    for item in output_items:
                        if item.get("type") == "message" and "content" in item:
                             for content in item["content"]:
                                 if content["type"] == "text": # Only if text modality is on
                                     pass 
                                 elif content["type"] == "audio":
                                     # The transcript is usually in 'transcript' field of audio content
                                     text = content.get("transcript", "")
                                     if text:
                                         self.transcript_history.append({"role": "assistant", "content": text})
                                         await self.send_to_client({
                                            "type": "transcript",
                                            "role": "assistant",
                                            "text": text
                                        })

                # 4. Function Calling (RAG)
                elif event_type == "response.function_call_arguments.done":
                    call_id = event["call_id"]
                    fname = event["name"]
                    args = json.loads(event["arguments"])
                    
                    if fname == "query_knowledge_base":
                        # Run non-blocking RAG task
                        asyncio.create_task(self.handle_rag_tool(call_id, args))

                # 5. Interrupt Handling
                elif event_type == "input_audio_buffer.speech_started":
                    await self.send_to_client({"type": "interrupt"})
                    await self.send_to_azure({"type": "response.cancel"})

        except Exception as e:
            logger.error(f"Azure Loop Error: {e}")

    async def process_client_messages(self):
        """Reads events from Client -> Sends to Azure"""
        try:
            while True:
                # Use receive() to handle both text and binary frames safely
                message = await self.client_ws.receive()
                
                if "text" in message:
                    data = message["text"]
                    try:
                        msg = json.loads(data)
                    except json.JSONDecodeError:
                        logger.error(f"Failed to decode JSON from client: {data}")
                        continue
                elif "bytes" in message:
                    # If we receive binary, we assume it's raw audio (if supported) or ignore it
                    # For now, we log it to understand what the client is sending
                    logger.warning(f"Received binary message of length {len(message['bytes'])}. Ignoring.")
                    continue
                else:
                    logger.warning(f"Received unexpected message type: {message.keys()}")
                    continue

                logger.debug(f"Received client message: {msg}")
                
                msg_type = msg.get("type")
                if not msg_type:
                    logger.warning(f"Missing 'type' in client message: {msg}")
                    continue

                # Handle custom audio_data wrapper
                if msg_type == "audio_data":
                    if "payload" in msg:
                        await self.send_to_azure({
                            "type": "input_audio_buffer.append",
                            "audio": msg["payload"]
                        })
                    else:
                        logger.error("Missing 'payload' in audio_data message")

                # Handle direct Azure-format messages (standard client libs often send this)
                elif msg_type == "input_audio_buffer.append":
                    # Pass through directly
                    await self.send_to_azure(msg)
                
                elif msg_type == "update_config":
                    # Dynamic voice configuration
                    await self.update_session_settings(msg)
                
        except Exception as e:
            logger.exception(f"Client Loop Error: {e}")