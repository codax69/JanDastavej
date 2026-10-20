import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-bold text-xl text-primary tracking-tight">JanDastavej</div>
          <div className="text-sm text-muted-foreground">કલેક્ટર કચેરી, ગાંધીનગર</div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 w-full">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-primary mb-2">JanDastavej — ડિજિટલ એફિડેવિટ / સોગંદનામું જનરેટર</h1>
          <p className="text-muted-foreground mb-4">
            Collector Office, Gandhinagar · Digital Affidavit / Declaration Generator (Demo Prototype)
          </p>
          <div className="inline-flex items-center rounded-md bg-warning-bg px-3 py-1 text-sm font-medium text-warning border border-warning/30">
            માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી (Demo only — not for official use)
          </div>
        </div>
      </main>
    </div>
  );
}
