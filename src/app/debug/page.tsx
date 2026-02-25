"use client";

import { useEffect, useState } from "react";
import { getClients } from "@/action/client";
import { getTasks } from "@/action/task";
import { getProjects } from "@/action/project";

export default function DebugPage() {
    const [clients, setClients] = useState<any>(null);
    const [tasks, setTasks] = useState<any>(null);
    const [projects, setProjects] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    useEffect(() => {
        const runDebug = async () => {
            addLog("Starting debug fetch...");

            try {
                addLog("Fetching projects...");
                const projRes = await getProjects();
                setProjects(projRes);
                addLog(`Projects: ${projRes.success ? `Success (${projRes.data?.length} items)` : `Failed: ${projRes.message}`}`);

                addLog("Fetching clients...");
                const clientRes = await getClients();
                setClients(clientRes);
                addLog(`Clients: ${clientRes.success ? `Success (${clientRes.data?.length} items)` : `Failed: ${clientRes.message}`}`);

                addLog("Fetching tasks...");
                const taskRes = await getTasks();
                setTasks(taskRes);
                addLog(`Tasks: ${taskRes.success ? `Success (${taskRes.data?.length} items)` : `Failed: ${taskRes.message}`}`);

            } catch (err: any) {
                addLog(`ERROR: ${err.message}`);
            }
        };

        runDebug();
    }, []);

    return (
        <div className="p-8 space-y-8 font-mono text-sm">
            <h1 className="text-2xl font-bold">Debug Data Fetching</h1>

            <div className="bg-black text-green-400 p-4 rounded h-48 overflow-y-auto">
                <h2 className="font-bold border-b border-green-800 mb-2">Logs</h2>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="border p-4 rounded bg-gray-50 overflow-auto max-h-[500px]">
                    <h2 className="font-bold mb-2">Projects Object</h2>
                    <pre>{JSON.stringify(projects, null, 2)}</pre>
                </div>
                <div className="border p-4 rounded bg-gray-50 overflow-auto max-h-[500px]">
                    <h2 className="font-bold mb-2">Clients Object</h2>
                    <pre>{JSON.stringify(clients, null, 2)}</pre>
                </div>
                <div className="border p-4 rounded bg-gray-50 overflow-auto max-h-[500px]">
                    <h2 className="font-bold mb-2">Tasks Object</h2>
                    <pre>{JSON.stringify(tasks, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
