
import React from 'react';

// New Icons
export const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955M3 10.5v9A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-9M12 21V12" />
  </svg>
);
export const PlaygroundIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25a8.25 8.25 0 00-8.25 8.25c0 1.913.64 3.705 1.75 5.25l.168.247c.07.102.14.198.216.293.076.095.152.19.232.282l.08.092c.07.082.14.16.216.232.076.073.152.142.232.21l.08.07c.07.06.14.118.216.174.076.055.152.11.232.162l.08.05c.07.042.14.08.216.118.076.038.152.072.232.105l.08.03c.07.022.14.04.216.058.076.018.152.034.232.048l.08.015c.07.008.14.014.216.018.076.004.152.006.232.006h.002a8.25 8.25 0 005.65-14.89" />
  </svg>
);
export const BuildIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.664 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.604-3.603l5.653-4.654M4.5 6.375a3.375 3.375 0 016.75 0 3.375 3.375 0 01-6.75 0z" />
  </svg>
);
export const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 16.5h16.5M3.75 20.25h16.5" />
  </svg>
);
export const DocsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
  </svg>
);
export const GoogleLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 92 30" {...props}>
    <path fill="#4285F4" d="M35.61 20.46c-1.33 0-2.58-.3-3.7-1.01-1.13-.7-2-1.68-2.6-2.92-.6-1.24-.9-2.6-.9-4.08s.3-2.84.9-4.08c.6-1.24 1.47-2.22 2.6-2.92 1.12-.7 2.37-1.01 3.7-1.01 1.3 0 2.5.28 3.58.98 1.07.68 1.94 1.58 2.56 2.68l-2.08 1.25c-.42-.76-1-1.34-1.7-1.74-.72-.4-1.53-.6-2.43-.6-1.01 0-1.92.25-2.7.75-.78.5-1.4 1.2-1.83 2.1-.44.9-.66 1.92-.66 3.03s.22 2.13.66 3.03c.43.9 1.05 1.6 1.83 2.1.78.5 1.69.75 2.7.75 1.13 0 2.1-.33 2.87-1.02.77-.68 1.16-1.6 1.16-2.76h-4.04V14.2h6.53c.07.36.1.72.1 1.1 0 1.4-.26 2.7-.8 3.88-.53 1.18-1.28 2.15-2.24 2.88-1 .75-2.16 1.1-3.46 1.1zM51.98 20.46c-1.33 0-2.58-.3-3.7-1.01-1.13-.7-2-1.68-2.6-2.92-.6-1.24-.9-2.6-.9-4.08s.3-2.84.9-4.08c.6-1.24 1.47-2.22 2.6-2.92 1.12-.7 2.37-1.01 3.7-1.01 1.33 0 2.58.3 3.7 1.01 1.13.7 2 1.68 2.6 2.92.6 1.24.9 2.6.9 4.08s-.3 2.84-.9 4.08c-.6 1.24-1.47-2.22-2.6 2.92-1.12.7-2.37 1.01-3.7 1.01zm0-2.2c1.03 0 1.95-.26 2.73-.78.78-.52 1.4-1.24 1.83-2.15.44-.9.66-1.93.66-3.07s-.22-2.17-.66-3.07c-.43-.9-1.05-1.63-1.83-2.15-.78-.52-1.7-.78-2.73-.78-1.03 0-1.95.26-2.73.78-.78.52-1.4 1.24-1.83 2.15-.44.9-.66 1.93-.66 3.07s.22 2.17.66 3.07c.43.9 1.05 1.63 1.83 2.15.78.52 1.7.78 2.73.78zM68.35 20.46c-1.33 0-2.58-.3-3.7-1.01-1.13-.7-2-1.68-2.6-2.92-.6-1.24-.9-2.6-.9-4.08s.3-2.84.9-4.08c.6-1.24 1.47-2.22 2.6-2.92 1.12-.7 2.37-1.01 3.7-1.01 1.33 0 2.58.3 3.7 1.01 1.13.7 2 1.68 2.6 2.92.6 1.24.9 2.6.9 4.08s-.3 2.84-.9 4.08c-.6 1.24-1.47-2.22-2.6 2.92-1.12.7-2.37 1.01-3.7 1.01zm0-2.2c1.03 0 1.95-.26 2.73-.78.78-.52 1.4-1.24 1.83-2.15.44-.9.66-1.93.66-3.07s-.22-2.17-.66-3.07c-.43-.9-1.05-1.63-1.83-2.15-.78-.52-1.7-.78-2.73-.78-1.03 0-1.95.26-2.73.78-.78.52-1.4 1.24-1.83 2.15-.44.9-.66 1.93-.66 3.07s.22 2.17.66 3.07c.43.9 1.05 1.63 1.83 2.15.78.52 1.7.78 2.73.78zM82.19 6h-2.14v16.14h2.14V6zM88.4 14.33c0-1.18-.34-2.22-1.02-3.13-.68-.9-1.6-1.6-2.76-2.1-.12-3.32-2.22-5.18-5.32-5.18-1.6 0-2.96.53-4.08 1.6-1.12 1.06-1.7 2.4-1.7 4.03h2.2c0-1.1.37-2.02 1.1-2.77.74-.75 1.66-1.12 2.76-1.12 2.1 0 3.45 1.1 3.45 3.3V14c-1.3-.9-2.8-1.35-4.5-1.35-1.5 0-2.85.34-4.05 1.02-1.2.68-2.16 1.6-2.9 2.77-.73 1.17-1.1 2.52-1.1 4.05 0 1.5.37 2.85 1.1 4.05.74 1.2 1.7 2.16 2.9 2.9 1.2.73 2.55 1.1 4.05 1.1 1.7 0 3.2-.45 4.5-1.35 1.1.9 2.45 1.35 4.05 1.35 1.5 0 2.78-.4 3.8-1.18 1.03-.78 1.54-1.82 1.54-3.1h-2.16c-.02 1.1-.74 1.65-2.16 1.65-1 0-1.8-.3-2.4-.9-.6-.6-.9-1.38-.9-2.35v-1.65c.53.53 1.2.93 2.02 1.2.82.28 1.66.42 2.52.42 1.5 0 2.8-.38 3.9-1.12 1.1-.75 1.66-1.8 1.66-3.15zm-1.66 2.5c-.7.6-1.58.9-2.6.9-.8 0-1.54-.15-2.23-.45-.68-.3-1.24-.74-1.66-1.3v-3.3c.42-.56.98-1 1.66-1.3.7-.3 1.44-.45 2.24-.45.98 0 1.82.3 2.52.9.7.6 1.04 1.38 1.04 2.34s-.34 1.75-1.02 2.35z"></path><path fill="#EA4335" d="M12.27 20.26c-1.1-.7-1.95-1.67-2.54-2.88-.6-1.2-.9-2.54-.9-4.04s.3-2.88.9-4.04c.6-1.2 1.45-2.18 2.54-2.88 1.1-.7 2.36-1.04 3.76-1.04 1.2 0 2.3.25 3.3.76l-1.5 2.3c-.6-.3-1.28-.46-2.03-.46-1.03 0-1.95.28-2.73.83-.8.55-1.4 1.28-1.83 2.2-.42.9-.64 1.93-.64 3.07s.2 2.17.63 3.07c.42.9 1.03 1.65 1.82 2.2.78.55 1.7.83 2.74.83 1.22 0 2.27-.38 3.16-1.15l1.6 2.2c-1.1.9-2.4 1.36-3.9 1.36-1.4 0-2.67-.35-3.77-1.05z"></path><path fill="#FBBC05" d="M0 29.8V0h2.4v29.8H0z"></path><path fill="#34A853" d="M23.33 29.3c-2.4-.6-4.2-2.1-5.4-4.5l2.1-1.2c.8 1.6 2 2.8 3.6 3.4.4.15.8.22 1.2.22 1.2 0 2.1-.4 2.7-1.2.6-.8.9-1.8.9-3s-.3-2.2-.9-3c-.6-.8-1.5-1.2-2.7-1.2-.4 0-.8.07-1.2.22-1.6.6-2.8 1.8-3.6 3.4l-2.1-1.2c1.2-2.4 3-3.9 5.4-4.5 2.4-.6 4.9-.3 6.9 1 .6.34 1.12.8 1.55 1.35.43.55.75 1.18.97 1.85.22.67.33 1.37.33 2.1s-.1 1.43-.33 2.1c-.22.67-.54 1.3-.97 1.85-.43.55-.95 1.02-1.55 1.35-2 1.3-4.5 1.6-6.9 1z"></path>
  </svg>
);

// General Icons
export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.554-.22 1.157-.14 1.666.231.508.372.833.955.833 1.6s-.325 1.228-.833 1.6c-.51.372-1.112.45-1.666.23-1.046-.415-1.898-1.332-1.898-2.457a2.536 2.536 0 01.09-1.007zM9.594 3.94C8.5 3.536 7.216 3 5.88 3c-1.336 0-2.618.536-3.535 1.455-1.42 1.42-2.345 3.535-2.345 5.657s.924 4.237 2.345 5.657c.917.919 2.2 1.455 3.535 1.455 1.336 0 2.62-.536 3.536-1.455.918-.919 1.455-2.2 1.455-3.536 0-1.336-.536-2.62-1.455-3.536S7.216 5.536 5.88 5.536c-.16 0-.317.008-.472.023m3.186-1.597c.508.372.833.955.833 1.6s-.325 1.228-.833 1.6c-.51.372-1.112.45-1.666.23-1.046-.415-1.898-1.332-1.898-2.457a2.536 2.536 0 01.09-1.007z" />
  </svg>
);

export const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181-3.183a8.25 8.25 0 00-11.664 0l3.181 3.183" />
    </svg>
);

export const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);


// Chat Icons
export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);
export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.25 18.25l1.188-.648a2.25 2.25 0 011.423-1.423L16.75 15l.648 1.188a2.25 2.25 0 011.423 1.423L19.75 18.25l-1.188.648a2.25 2.25 0 01-1.423 1.423z" />
    </svg>
);
export const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);
export const DocumentSearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-1.5l-2.625 2.625a3.375 3.375 0 004.773 4.773l2.625-2.625m2.121-7.121a3.375 3.375 0 00-4.773-4.773L9.75 9.75m4.5 4.5l-4.5 4.5m0-13.5h-5.25a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h5.25" />
    </svg>
);
export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Sidebar Icons
export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);
export const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);
export const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
);
export const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
);
export const HashtagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
    </svg>
);
export const VectorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
);
export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.716c-1.126 0-2.037.954-2.037 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
export const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);
