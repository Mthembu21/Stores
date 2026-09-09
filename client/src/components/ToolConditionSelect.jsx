import toast from 'react-hot-toast';
import { useUpdateTool } from '../services/tools';

export function ToolConditionSelect({ tool }) {
  const updateTool = useUpdateTool();

  return (
    <select
      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
      value={tool.flag || 'None'}
      onChange={(e) => {
        const id = tool._id || tool.id;
        if (!id) {
          toast.error('Could not update tool: missing id');
          return;
        }
        const nextFlag = e.target.value;
        updateTool.mutate(
          { id, patch: { flag: nextFlag } },
          {
            onSuccess: () => {
              if (tool.flag !== 'None' && nextFlag === 'None') {
                toast.success('Tool repaired and back in the available pool');
              }
            },
          }
        );
      }}
      disabled={updateTool.isPending}
    >
      <option value="None">Good</option>
      <option value="Damaged">Damaged</option>
      <option value="Missing">Missing</option>
    </select>
  );
}
