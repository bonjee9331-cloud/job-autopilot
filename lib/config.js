export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Job Autopilot',
  demoMode: (process.env.NEXT_PUBLIC_DEMO_MODE || 'true') === 'true'
};
