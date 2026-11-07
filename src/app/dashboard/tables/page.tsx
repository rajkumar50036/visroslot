"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { useAppStore } from "@/lib/store/app-store";
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  ExternalLink, 
  Eye, 
  Users,
  CheckCircle2,
  X
} from "lucide-react";
import { RestaurantTable } from "@/types/database";

export default function TablesManagementPage() {
  const { state, addTable, deleteTable } = useAppStore();
  const [qrDataUrls, setQrDataUrls] = useState<{ [tableId: string]: string }>({});
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableCap, setNewTableCap] = useState("4");
  const [previewTable, setPreviewTable] = useState<RestaurantTable | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  // Generate QR codes for all tables
  useEffect(() => {
    state.tables.forEach(async (tbl) => {
      const url = `${baseUrl}/r/${state.restaurant.slug}/t/${tbl.secure_token}`;
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          color: {
            dark: "#0b1c30",
            light: "#ffffff",
          },
        });
        setQrDataUrls((prev) => ({ ...prev, [tbl.id]: dataUrl }));
      } catch (err) {
        console.error("QR Code generation error:", err);
      }
    });
  }, [state.tables, state.restaurant.slug, baseUrl]);

  const handleCreateTable = () => {
    if (!newTableNum.trim()) return;
    addTable(newTableNum.trim(), parseInt(newTableCap) || 4);
    setNewTableNum("");
    setIsAddTableOpen(false);
  };

  const downloadQr = (tbl: RestaurantTable) => {
    const dataUrl = qrDataUrls[tbl.id];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `restoflow-table-${tbl.table_number}-qr.png`;
    a.click();
  };

  const handlePrintTent = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased overflow-hidden font-sans select-none">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden bg-[#f8f9ff]">
        <TopNav searchQuery="" onSearchChange={() => {}} />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#c3c6d7]/60 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#dbe1ff] text-[#004ac6]">
                  <QrCode className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-extrabold text-[#0b1c30]">
                  Table & QR Codes Hub
                </h1>
              </div>
              <p className="text-xs text-[#434655] mt-1">
                Generate high-resolution table QR codes with secure cryptographic tokens. Download printable tent stands.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintTent}
                className="px-3.5 py-2 rounded-lg bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#004ac6] border border-[#c3c6d7] text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All QR Tents</span>
              </button>

              <button
                onClick={() => setIsAddTableOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dining Table</span>
              </button>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {state.tables.map((table) => {
              const qrUrl = qrDataUrls[table.id];
              const tableDinerUrl = `/r/${state.restaurant.slug}/t/${table.secure_token}`;

              return (
                <div
                  key={table.id}
                  className="bg-white rounded-xl border border-[#c3c6d7]/60 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#c3c6d7]/30">
                      <div>
                        <span className="font-extrabold text-base text-[#0b1c30]">
                          Table {table.table_number}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-[#434655] mt-0.5">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity} Seats</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Active QR
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="my-3 flex flex-col items-center justify-center p-3 bg-[#f8f9ff] rounded-xl border border-[#c3c6d7]/40">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR for Table ${table.table_number}`}
                          className="w-36 h-36 object-contain rounded-lg shadow-sm bg-white p-1"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-xs text-gray-400">
                          Generating QR...
                        </div>
                      )}
                      <span className="font-mono text-[9px] text-[#737686] mt-2 truncate max-w-[180px]">
                        Token: {table.secure_token}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs py-1">
                      <div className="p-1.5 rounded bg-[#f8f9ff] border border-[#c3c6d7]/30">
                        <span className="text-[10px] text-[#737686] block">Total Scans</span>
                        <span className="font-bold text-[#0b1c30]">{table.total_scans || 34}</span>
                      </div>
                      <div className="p-1.5 rounded bg-[#f8f9ff] border border-[#c3c6d7]/30">
                        <span className="text-[10px] text-[#737686] block">Active Orders</span>
                        <span className="font-bold text-[#004ac6]">{table.active_orders_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#c3c6d7]/30 flex items-center justify-between gap-1.5 mt-2">
                    <button
                      onClick={() => downloadQr(table)}
                      className="flex-1 py-1.5 px-2 bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#004ac6] border border-[#c3c6d7] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      title="Download PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>

                    <a
                      href={tableDinerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-[#004ac6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      title="Open Diner View"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Diner</span>
                    </a>

                    <button
                      onClick={() => {
                        if (confirm(`Remove Table ${table.table_number}?`)) {
                          deleteTable(table.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add Table Modal */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#c3c6d7]/40 mb-3">
              <h3 className="font-bold text-sm text-[#0b1c30]">Add New Table</h3>
              <button onClick={() => setIsAddTableOpen(false)}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0b1c30] block mb-1">Table Number</label>
                <input
                  type="text"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="e.g. 15 or Patio 02"
                  className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0b1c30] block mb-1">Seat Capacity</label>
                <select
                  value={newTableCap}
                  onChange={(e) => setNewTableCap(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#c3c6d7] bg-[#f8f9ff]"
                >
                  <option value="2">2 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="6">6 Guests</option>
                  <option value="8">8 Guests</option>
                  <option value="12">12 Guests (Party Table)</option>
                </select>
              </div>

              <button
                onClick={handleCreateTable}
                className="w-full py-2.5 bg-[#004ac6] hover:bg-[#2563eb] text-white font-bold text-xs rounded-lg mt-2 shadow-md"
              >
                Create Table & Generate QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
