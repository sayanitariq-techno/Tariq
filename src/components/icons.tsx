
import type { SVGProps } from "react";

export function TechnofiableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      {...props}
    >
      <rect width="100" height="100" rx="20" fill="#00539B" />
      <path
        d="M25,25 H45 V45 H35 V85 H25 V25 Z"
        fill="#FFFFFF"
      />
      <path
        d="M55,25 H85 V35 H55 V25 Z M55,45 H75 V55 H55 V45 Z M55,65 H85 V75 H55 V65 Z"
        fill="#8DC63F"
      />
    </svg>
  );
}
