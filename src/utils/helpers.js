import React from 'react';

// Format as Indian Rupees
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
];

export const getMonthName = (month) => MONTH_NAMES[(month - 1) % 12];

// Show full Aadhar number as-is
export const maskAadhar = (aadhar = '') => aadhar || '-';
