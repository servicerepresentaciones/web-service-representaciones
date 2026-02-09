import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Eye, MoreHorizontal, FileText, Calendar, User, MapPin } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const { data, error } = await supabase
                .from("complaints")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setComplaints(data || []);
        } catch (error: any) {
            toast({
                title: "Error al cargar reclamos",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("complaints")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;

            setComplaints(complaints.map(c => c.id === id ? { ...c, status: newStatus } : c));

            toast({
                title: "Estado actualizado",
                description: `El reclamo ahora está en estado: ${newStatus}`,
            });
        } catch (error: any) {
            toast({
                title: "Error al actualizar",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pendiente":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
            case "en_proceso":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Proceso</Badge>;
            case "resuelto":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resuelto</Badge>;
            case "rechazado":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/admin");
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar onLogout={handleLogout} />
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Libro de Reclamaciones</h1>
                        <p className="text-gray-500">Gestiona las quejas y reclamos de los clientes.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center p-20">
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {complaints.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                            No hay reclamos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    complaints.map((complaint) => (
                                        <TableRow key={complaint.id}>
                                            <TableCell className="font-medium text-xs">
                                                {format(new Date(complaint.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{complaint.first_name} {complaint.last_name_1}</span>
                                                    <span className="text-xs text-gray-500">{complaint.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{complaint.claim_type}</span>
                                                    <span className="text-xs text-gray-500">{complaint.consumption_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {complaint.claimed_amount ? `S/ ${complaint.claimed_amount}` : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(complaint.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedComplaint(complaint);
                                                            setIsDetailOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" /> Ver
                                                    </Button>
                                                    <Select
                                                        value={complaint.status}
                                                        onValueChange={(val) => handleStatusChange(complaint.id, val)}
                                                    >
                                                        <SelectTrigger className="w-[130px] h-9 text-xs">
                                                            <SelectValue placeholder="Estado" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pendiente">Pendiente</SelectItem>
                                                            <SelectItem value="en_proceso">En Proceso</SelectItem>
                                                            <SelectItem value="resuelto">Resuelto</SelectItem>
                                                            <SelectItem value="rechazado">Rechazado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Modal de Detalle */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-accent">
                                <FileText className="w-6 h-6" />
                                Detalle del Reclamo #{selectedComplaint?.id.slice(0, 8)}
                            </DialogTitle>
                            <DialogDescription>
                                Información detallada proporcionada por el cliente.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedComplaint && (
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Datos del Reclamante
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                            <p><strong>Nombre:</strong> {selectedComplaint.first_name} {selectedComplaint.last_name_1} {selectedComplaint.last_name_2}</p>
                                            <p><strong>Documento:</strong> {selectedComplaint.document_type} - {selectedComplaint.document_number}</p>
                                            <p><strong>Teléfono:</strong> {selectedComplaint.phone}</p>
                                            <p><strong>Email:</strong> {selectedComplaint.email}</p>
                                            <p><strong>Menor de edad:</strong> {selectedComplaint.is_minor ? "Sí" : "No"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> Ubicación
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                            <p><strong>Dirección:</strong> {selectedComplaint.address}</p>
                                            <p><strong>Ubigeo:</strong> {selectedComplaint.department} / {selectedComplaint.province} / {selectedComplaint.district}</p>
                                            <p><strong>Referencia:</strong> {selectedComplaint.reference || "-"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Información del Reclamo
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4 text-sm">
                                        <p><strong>Tipo:</strong> {selectedComplaint.claim_type}</p>
                                        <p><strong>Consumo:</strong> {selectedComplaint.consumption_type}</p>
                                        <p><strong>Pedido:</strong> {selectedComplaint.order_number || "-"}</p>
                                        <p><strong>Monto Reclamado:</strong> {selectedComplaint.claimed_amount ? `S/ ${selectedComplaint.claimed_amount}` : "0.00"}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold font-bold text-gray-700">Descripción del Bien/Servicio</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg text-sm border-l-4 border-accent">
                                        {selectedComplaint.description}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold font-bold text-gray-700">Detalle de la Reclamación / Queja</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg text-sm border-l-4 border-accent">
                                        {selectedComplaint.claim_details}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold font-bold text-gray-700">Pedido del Cliente</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg text-sm border-l-4 border-accent">
                                        {selectedComplaint.customer_request}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div className="p-3 bg-gray-50 rounded border border-gray-100">
                                        <p className="font-bold text-gray-500 mb-1">FECHA COMPRA</p>
                                        <p>{selectedComplaint.purchase_date || "-"}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-100">
                                        <p className="font-bold text-gray-500 mb-1">FECHA CONSUMO</p>
                                        <p>{selectedComplaint.consumption_date_detail || "-"}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded border border-gray-100">
                                        <p className="font-bold text-gray-500 mb-1">FECHA CADUCIDAD</p>
                                        <p>{selectedComplaint.expiry_date || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t">
                                    <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminComplaints;
