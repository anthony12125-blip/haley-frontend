import * as React from "react";

type Props = React.SVGProps<SVGSVGElement>;

export default function IconSoundboard(props: Props) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6.5 6.8h11A3.5 3.5 0 0 1 21 10.3v4.2A3.5 3.5 0 0 1 17.5 18H11l-3.4 2v-2H6.5A3.5 3.5 0 0 1 3 14.5v-4.2A3.5 3.5 0 0 1 6.5 6.8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.5v3.8M12 9.5v5.8M16 11.2v3.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
