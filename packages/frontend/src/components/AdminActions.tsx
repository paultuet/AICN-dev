import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui";
import api from "@/services/api";

const AdminsActions = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="p-4 bg-red-300 rounded-md mb-6 flex flex-col gap-2">
      <h2 className="text-xl font-bold text-red-600">ADMIN actions</h2>
      <div>
        <Button variant="danger" onClick={() => api.post("/sync")}>Synchroniser avec Airtable</Button>
      </div>

    </div>
  );
}

export default AdminsActions;
