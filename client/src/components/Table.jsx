export function Table({ columns, rows, emptyLabel = 'No data', getRowClassName }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id || i}
                className={`border-t border-slate-100 ${
                  getRowClassName ? getRowClassName(row) : ''
                }`.trim()}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
