export const api = {
  getStats: () => fetch("/api/stats").then(res => res.json()),
  getPatients: () => fetch("/api/patients").then(res => res.json()),
  addPatient: (data: any) => fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  getAppointments: () => fetch("/api/appointments").then(res => res.json()),
  addAppointment: (data: any) => fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  getPrescriptions: () => fetch("/api/prescriptions").then(res => res.json()),
  addPrescription: (data: any) => fetch("/api/prescriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  getPayments: () => fetch("/api/payments").then(res => res.json()),
  addPayment: (data: any) => fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json()),
};
