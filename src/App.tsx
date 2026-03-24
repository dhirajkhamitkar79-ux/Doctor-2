import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  Menu, 
  X,
  TrendingUp,
  UserPlus,
  Clock,
  DollarSign,
  ChevronRight,
  Stethoscope,
  Activity,
  AlertCircle
} from "lucide-react";
import { api } from "./lib/api";
import { gemini } from "./lib/gemini";
import { Toaster, toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Validation Schemas ---

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Please enter a valid age"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Please select gender" }),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const appointmentSchema = z.object({
  patient: z.string().min(2, "Patient name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  type: z.enum(["Checkup", "Follow-up", "Emergency", "Surgery"], { message: "Please select appointment type" }),
});

const paymentSchema = z.object({
  patient: z.string().min(2, "Patient name is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0"),
  method: z.enum(["Cash", "Card", "Insurance", "Online"], { message: "Please select payment method" }),
});

const symptomsSchema = z.object({
  symptoms: z.string().min(3, "Please describe symptoms in more detail"),
});

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <motion.button
    whileHover={{ scale: 1.02, x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </motion.button>
);

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={color.replace("bg-", "text-")} size={24} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
  </motion.div>
);

const TableRow = ({ children, index }: any) => (
  <motion.tr
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="border-b border-slate-50 hover:bg-slate-50 transition-colors group"
  >
    {children}
  </motion.tr>
);

const Modal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Pages ---

const Dashboard = ({ stats, onNewPatient, onViewAllAppointments, recentAppointments, onRunAnalysis }: any) => (
  <div className="space-y-8">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Dr. Smith</h1>
        <p className="text-slate-500">Here's what's happening in your clinic today.</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={onViewAllAppointments}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
        >
          <Calendar size={18} />
          <span>Schedule</span>
        </button>
        <button 
          onClick={onNewPatient}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={18} />
          <span>New Patient</span>
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon={Users} label="Total Patients" value={stats.patients} trend="+12%" color="bg-blue-600" />
      <StatCard icon={Calendar} label="Appointments" value={stats.appointments} trend="+5%" color="bg-purple-600" />
      <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue}`} trend="+18%" color="bg-green-600" />
      <StatCard icon={Activity} label="Prescriptions" value={stats.prescriptions} trend="+2%" color="bg-orange-600" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Recent Appointments</h3>
          <button onClick={onViewAllAppointments} className="text-blue-600 text-sm font-medium hover:underline">View all</button>
        </div>
        <div className="space-y-4">
          {recentAppointments.length > 0 ? recentAppointments.map((a: any, i: number) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {a.patient.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{a.patient}</p>
                  <p className="text-xs text-slate-500">{a.type} • {a.time}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          )) : (
            <p className="text-slate-500 text-center py-8">No recent appointments</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Patient Insights</h3>
          <Activity size={20} className="text-blue-600" />
        </div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex gap-3 mb-2">
            <AlertCircle size={18} className="text-blue-600 shrink-0" />
            <p className="text-sm font-medium text-blue-900">AI Pattern Detection</p>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed mb-4">
            Analyze recent patient data to identify health trends and potential risks in your clinic.
          </p>
          <button 
            onClick={onRunAnalysis}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Run Analysis
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PatientsPage = ({ patients, onAdd }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(patientSchema)
  });

  const onSubmit = (data: any) => {
    onAdd(data);
    setIsModalOpen(false);
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500">Manage and track your patient records.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <UserPlus size={18} />
          <span>Add Patient</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Age/Gender</th>
              <th className="px-6 py-4 font-semibold">Phone</th>
              <th className="px-6 py-4 font-semibold">Last Visit</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p: any, i: number) => (
              <TableRow key={p.id} index={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.age} / {p.gender}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.phone}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Patient">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              {...register("name")}
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.name ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input 
                type="number"
                {...register("age")}
                className={`w-full px-4 py-2 bg-slate-50 border ${errors.age ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select 
                {...register("gender")}
                className={`w-full px-4 py-2 bg-slate-50 border ${errors.gender ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message as string}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input 
              {...register("phone")}
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.phone ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-4">
            Register Patient
          </button>
        </form>
      </Modal>
    </div>
  );
};

const PrescriptionPage = ({ patients, onAdd }: any) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(symptomsSchema)
  });

  const handleSuggest = async (data: any) => {
    setLoading(true);
    try {
      const res = await gemini.suggestMedicine(data.symptoms);
      setSuggestions(res);
    } catch (err) {
      toast.error("Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = (med: any) => {
    setSelectedMedicines([...selectedMedicines, { ...med, id: Date.now() }]);
  };

  const removeMedicine = (id: number) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient");
      return;
    }
    if (selectedMedicines.length === 0) {
      toast.error("Please add at least one medicine");
      return;
    }

    const patient = patients.find((p: any) => p.id === selectedPatientId);
    
    await onAdd({
      patientId: selectedPatientId,
      patientName: patient?.name,
      medicines: selectedMedicines,
      date: new Date().toISOString()
    });
    
    setSelectedMedicines([]);
    setSuggestions([]);
    setSelectedPatientId("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Prescription Generator</h1>
        <p className="text-slate-500">AI-powered medicine suggestions based on symptoms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Symptoms Analysis</h3>
            <form onSubmit={handleSubmit(handleSuggest)}>
              <textarea 
                {...register("symptoms")}
                placeholder="Enter patient symptoms..."
                className={`w-full h-32 px-4 py-3 bg-slate-50 border ${errors.symptoms ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm mb-2`}
              />
              {errors.symptoms && <p className="text-red-500 text-xs mb-4">{errors.symptoms.message as string}</p>}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : (
                  <>
                    <Stethoscope size={18} />
                    <span>Get AI Suggestions</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
            >
              <h3 className="font-bold text-slate-900 mb-4">Suggested Medicines</h3>
              <div className="space-y-3">
                {suggestions.map((med, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-900">{med.name}</p>
                      <button 
                        onClick={() => addMedicine(med)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">{med.dosage} • {med.reason}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl min-h-[600px] flex flex-col">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-2xl font-black text-blue-600 tracking-tight">MEDFLOW</h2>
                <p className="text-xs text-slate-400 font-medium">CLINIC MANAGEMENT SYSTEM</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">Dr. Alexander Smith</p>
                <p className="text-xs text-slate-500">MBBS, MD • Reg No: 123456</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12 py-6 border-y border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                <select 
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 outline-none"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                <p className="font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">Rx</div>
                <h3 className="font-bold text-slate-900">Prescription</h3>
              </div>

              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {selectedMedicines.map((med) => (
                    <motion.div 
                      key={med.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{med.name}</p>
                        <p className="text-sm text-slate-500">{med.dosage}</p>
                      </div>
                      <button 
                        onClick={() => removeMedicine(med.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {selectedMedicines.length === 0 && (
                  <p className="text-slate-400 italic text-center py-12">No medicines added yet.</p>
                )}
              </div>
            </div>

            <div className="pt-12 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Next Visit: 1 Week</p>
                <p className="text-xs text-slate-400">Contact: +1 234 567 890</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-px bg-slate-200 mb-2"></div>
                <p className="text-xs font-bold text-slate-900">Doctor's Signature</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">
              Save Draft
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <FileText size={18} />
              <span>Confirm & Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentsPage = ({ appointments, onAdd }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(appointmentSchema)
  });

  const onSubmit = (data: any) => {
    onAdd(data);
    setIsModalOpen(false);
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500">Manage and track your clinic schedule.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={18} />
          <span>New Appointment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Patient</th>
              <th className="px-6 py-4 font-semibold">Date/Time</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a: any, i: number) => (
              <TableRow key={a.id} index={i}>
                <td className="px-6 py-4 font-bold text-slate-900">{a.patient}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{a.date} at {a.time}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{a.type}</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Confirmed</span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Appointment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
            <input 
              {...register("patient")}
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.patient ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            />
            {errors.patient && <p className="text-red-500 text-xs mt-1">{errors.patient.message as string}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date"
                {...register("date")}
                className={`w-full px-4 py-2 bg-slate-50 border ${errors.date ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
              <input 
                type="time"
                {...register("time")}
                className={`w-full px-4 py-2 bg-slate-50 border ${errors.time ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
              />
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message as string}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Type</label>
            <select 
              {...register("type")}
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.type ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            >
              <option value="">Select</option>
              <option value="Checkup">Checkup</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
              <option value="Surgery">Surgery</option>
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message as string}</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-4">
            Schedule Appointment
          </button>
        </form>
      </Modal>
    </div>
  );
};

const PaymentsPage = ({ payments, onAdd }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema)
  });

  const onSubmit = (data: any) => {
    onAdd({ ...data, amount: Number(data.amount) });
    setIsModalOpen(false);
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500">Track and manage clinic revenue.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={18} />
          <span>Record Payment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Patient</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Method</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any, i: number) => (
              <TableRow key={p.id} index={i}>
                <td className="px-6 py-4 font-bold text-slate-900">{p.patient}</td>
                <td className="px-6 py-4 font-bold text-slate-900">${p.amount}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.method}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Paid</span>
                </td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
            <input 
              {...register("patient")}
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.patient ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            />
            {errors.patient && <p className="text-red-500 text-xs mt-1">{errors.patient.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
            <input 
              type="number"
              {...register("amount")}
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.amount ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <select 
              {...register("method")}
              className={`w-full px-4 py-2 bg-slate-50 border ${errors.method ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
            >
              <option value="">Select</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Insurance">Insurance</option>
              <option value="Online">Online</option>
            </select>
            {errors.method && <p className="text-red-500 text-xs mt-1">{errors.method.message as string}</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-4">
            Record Payment
          </button>
        </form>
      </Modal>
    </div>
  );
};

const SettingsPage = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
      <p className="text-slate-500">Configure your clinic and profile settings.</p>
    </div>

    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <div>
            <p className="font-bold text-slate-900">Dark Mode</p>
            <p className="text-xs text-slate-500">Switch between light and dark themes.</p>
          </div>
          <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all"></div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <div>
            <p className="font-bold text-slate-900">Email Notifications</p>
            <p className="text-xs text-slate-500">Receive daily appointment summaries.</p>
          </div>
          <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all"></div>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100">
          <button className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">
            Logout Account
          </button>
        </div>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ patients: 0, appointments: 0, revenue: 0, prescriptions: 0 });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, p, a, pay] = await Promise.all([
        api.getStats(), 
        api.getPatients(),
        api.getAppointments(),
        api.getPayments()
      ]);
      setStats(s);
      setPatients(p);
      setAppointments(a);
      setPayments(pay);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (data: any) => {
    try {
      await api.addPatient(data);
      toast.success("Patient added successfully");
      loadData();
    } catch (err) {
      toast.error("Failed to add patient");
    }
  };

  const handleAddAppointment = async (data: any) => {
    try {
      await api.addAppointment(data);
      toast.success("Appointment scheduled");
      loadData();
    } catch (err) {
      toast.error("Failed to schedule appointment");
    }
  };

  const handleAddPayment = async (data: any) => {
    try {
      await api.addPayment(data);
      toast.success("Payment recorded");
      loadData();
    } catch (err) {
      toast.error("Failed to record payment");
    }
  };

  const handleAddPrescription = async (data: any) => {
    try {
      await api.addPrescription(data);
      toast.success("Prescription saved successfully");
      loadData();
    } catch (err) {
      toast.error("Failed to save prescription");
    }
  };

  const handleRunAnalysis = async () => {
    try {
      const insights = await gemini.detectPatterns(patients);
      toast.info("AI Insight", { description: insights });
    } catch (err) {
      toast.error("Failed to run AI analysis");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": 
        return (
          <Dashboard 
            stats={stats} 
            onNewPatient={() => setActiveTab("patients")}
            onViewAllAppointments={() => setActiveTab("appointments")}
            recentAppointments={appointments.slice(0, 3)}
            onRunAnalysis={handleRunAnalysis}
          />
        );
      case "patients": return <PatientsPage patients={patients} onAdd={handleAddPatient} />;
      case "appointments": return <AppointmentsPage appointments={appointments} onAdd={handleAddAppointment} />;
      case "prescriptions": return <PrescriptionPage patients={patients} onAdd={handleAddPrescription} />;
      case "payments": return <PaymentsPage payments={payments} onAdd={handleAddPayment} />;
      case "settings": return <SettingsPage />;
      default: return <Dashboard stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium animate-pulse">Initializing MedFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col gap-8 fixed h-full z-40">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Stethoscope size={24} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 tracking-tight leading-none">MEDFLOW</h2>
            <p className="text-[10px] font-bold text-blue-600 tracking-widest mt-1">CLINIC OS</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <SidebarItem icon={Users} label="Patients" active={activeTab === "patients"} onClick={() => setActiveTab("patients")} />
          <SidebarItem icon={Calendar} label="Appointments" active={activeTab === "appointments"} onClick={() => setActiveTab("appointments")} />
          <SidebarItem icon={FileText} label="Prescriptions" active={activeTab === "prescriptions"} onClick={() => setActiveTab("prescriptions")} />
          <SidebarItem icon={CreditCard} label="Payments" active={activeTab === "payments"} onClick={() => setActiveTab("payments")} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">AS</div>
            <div>
              <p className="text-xs font-bold text-slate-900">Dr. Alexander</p>
              <p className="text-[10px] text-slate-500">Premium Plan</p>
            </div>
          </div>
          <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            UPGRADE NOW
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10">
        <header className="flex justify-between items-center mb-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-blue-600 transition-colors shadow-sm relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://picsum.photos/seed/doctor/100/100" alt="Profile" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
