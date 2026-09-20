"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { Employee, RecordFile } from "@/lib/types";

export function FilesBoard({ employee, files }: { employee: Employee; files: RecordFile[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("employeeId", employee.id);
    const response = await fetch("/api/files", { method: "POST", body: data });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error || "Could not upload file.");
      return;
    }
    form.reset();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this file from your record?")) return;
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <form onSubmit={onSubmit} className="card space-y-4 p-5 sm:p-6">
        <h2 className="serif text-2xl">Add a record file</h2>
        <p className="text-sm text-ink-soft">Timesheets, hour sheets, ID and statements. PDF, image or spreadsheet, up to 10MB.</p>
        <label className="field">
          File
          <input required name="file" type="file" />
        </label>
        <label className="field">
          Category
          <select name="category" defaultValue="timesheet">
            <option value="timesheet">Timesheet / hours</option>
            <option value="statement">Statement</option>
            <option value="id">ID / right to work</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="field">
          Notes
          <input name="notes" placeholder="Week ending 20 Sep, site copy…" />
        </label>
        {error ? <p className="text-sm text-warn">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={saving} type="submit">
          {saving ? "Uploading…" : "Save to my record"}
        </button>
      </form>
      <article className="card overflow-hidden">
        {files.length === 0 ? (
          <p className="p-5 text-ink-soft">No files on this personal record yet.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <a className="font-semibold" href={`/api/files/${file.id}`}>
                      {file.originalName}
                    </a>
                    {file.notes ? <p className="text-xs text-ink-soft">{file.notes}</p> : null}
                  </td>
                  <td className="capitalize">{file.category}</td>
                  <td>{formatDate(file.uploadedAt)}</td>
                  <td>
                    <button className="text-sm text-seal" type="button" onClick={() => remove(file.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </div>
  );
}
