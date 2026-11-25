import Image from "next/image";

export function Brand() {
  return <span className="inline-flex items-center gap-3">
    <Image src="/DriveM.svg" alt="" width={38} height={38} unoptimized className="rounded-lg" />
    <span className="text-[19px] font-bold tracking-tight">DriveM <span className="text-muted font-medium">CRM</span></span>
  </span>;
}
