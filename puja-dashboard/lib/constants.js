// Booking lifecycle, in order: Pending -> Confirmed -> In Progress -> Completed
export const STATUSES = ["Pending", "Confirmed", "In Progress", "Completed"];

export const PUJAS = [
  { name: "Rudrabhishek", temple: "Kashi Vishwanath, Varanasi", price: 2100 },
  { name: "Satyanarayan Katha", temple: "ISKCON, Vrindavan", price: 1501 },
  { name: "Navagraha Shanti", temple: "Navagraha Temple, Guwahati", price: 3100 },
  { name: "Lakshmi Puja", temple: "Mahalakshmi Temple, Kolhapur", price: 1100 },
  { name: "Maha Mrityunjaya Jaap", temple: "Mahakaleshwar, Ujjain", price: 5100 },
  { name: "Ganesh Puja", temple: "Siddhivinayak, Mumbai", price: 951 },
];

export const ADD_ONS = [
  { name: "Prasad Delivery", price: 251 },
  { name: "Flower Garland Offering", price: 151 },
  { name: "Deep Daan (Diya)", price: 101 },
  { name: "Vastra Offering", price: 501 },
];
