import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 상대 경로: 웹(Vercel)과 앱 껍데기(Capacitor, Android·iOS)에서 같은 빌드를 그대로 쓰기 위해
  base: './',
  server: { host: true },
});
