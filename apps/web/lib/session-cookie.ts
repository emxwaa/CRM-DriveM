export const authCookieOptions = (secure: boolean) => ({
  name: "drivem-session",
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
});
