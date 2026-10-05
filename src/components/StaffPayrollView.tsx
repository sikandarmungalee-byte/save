import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { StaffMember, PayrollPayout } from '../types/erp';
import {
  Users,
  DollarSign,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  Edit2,
  Trash2,
  Printer,
  X,
  FileSpreadsheet,
  AlertCircle,
  Briefcase,
  ChevronRight
} from 'lucide-react';

export const StaffPayrollView: React.FC = () => {
  const {
    staff,
    payrollPayouts,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
    createPayrollPayout,
    updatePayrollPayout,
    deletePayrollPayout,
    company,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'payouts' | 'staff'>('payouts');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // "YYYY-MM"
  );

  // Search & Filters
  const [staffSearch, setStaffSearch] = useState('');
  const [payoutSearch, setPayoutSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Pending'>('ALL');

  // Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState({
    employeeCode: '',
    name: '',
    idNumber: '',
    role: 'Bakery Production',
    department: 'Production',
    phone: '',
    email: '',
    employmentType: 'Full-time' as StaffMember['employmentType'],
    basicSalary: '',
    hourlyRate: '',
    overtimeHourlyRate: '',
    bankName: 'First National Bank (FNB)',
    accountHolder: '',
    accountNumber: '',
    branchCode: '250655',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active' as StaffMember['status'],
  });

  // Payout Modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<PayrollPayout | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    staffId: '',
    month: selectedMonth,
    basicSalary: '',
    overtimeHours: '',
    overtimeRate: '',
    bonusAmount: '',
    deductions: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'EFT / Bank Transfer' as PayrollPayout['paymentMethod'],
    status: 'Paid' as PayrollPayout['status'],
    reference: '',
    notes: '',
  });

  // Payslip Print Preview Modal
  const [printingPayout, setPrintingPayout] = useState<PayrollPayout | null>(null);

  // Filtered lists
  const filteredStaff = staff.filter((s) => {
    const term = staffSearch.toLowerCase().trim();
    return (
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.role.toLowerCase().includes(term) ||
      s.employeeCode.toLowerCase().includes(term)
    );
  });

  const filteredPayouts = payrollPayouts.filter((p) => {
    const matchesMonth = !selectedMonth || p.month === selectedMonth;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const term = payoutSearch.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.staffName.toLowerCase().includes(term) ||
      p.payoutNumber.toLowerCase().includes(term) ||
      p.role.toLowerCase().includes(term);
    return matchesMonth && matchesStatus && matchesSearch;
  });

  // Calculations for selected month
  const monthPayouts = payrollPayouts.filter((p) => !selectedMonth || p.month === selectedMonth);
  const totalSalariesPaid = monthPayouts
    .filter((p) => p.status === 'Paid')
    .reduce((acc, p) => acc + (p.netPayout || 0), 0);
  const totalOvertimePaid = monthPayouts
    .filter((p) => p.status === 'Paid')
    .reduce((acc, p) => acc + (p.overtimePay || 0), 0);
  const pendingPayoutsTotal = monthPayouts
    .filter((p) => p.status === 'Pending')
    .reduce((acc, p) => acc + (p.netPayout || 0), 0);

  // Open Staff Modal
  const openStaffModal = (s?: StaffMember) => {
    if (s) {
      setEditingStaff(s);
      setStaffForm({
        employeeCode: s.employeeCode,
        name: s.name,
        idNumber: s.idNumber || '',
        role: s.role,
        department: s.department || 'Production',
        phone: s.phone,
        email: s.email || '',
        employmentType: s.employmentType,
        basicSalary: s.basicSalary ? String(s.basicSalary) : '',
        hourlyRate: s.hourlyRate ? String(s.hourlyRate) : '',
        overtimeHourlyRate: s.overtimeHourlyRate ? String(s.overtimeHourlyRate) : '',
        bankName: s.bankName,
        accountHolder: s.accountHolder,
        accountNumber: s.accountNumber,
        branchCode: s.branchCode,
        startDate: s.startDate,
        status: s.status,
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        employeeCode: `STF-${String(staff.length + 1).padStart(3, '0')}`,
        name: '',
        idNumber: '',
        role: 'Bakery Production',
        department: 'Production',
        phone: '',
        email: '',
        employmentType: 'Full-time',
        basicSalary: '',
        hourlyRate: '',
        overtimeHourlyRate: '',
        bankName: 'First National Bank (FNB)',
        accountHolder: '',
        accountNumber: '',
        branchCode: '250655',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      });
    }
    setIsStaffModalOpen(true);
  };

  // Open Payout Modal
  const openPayoutModal = (p?: PayrollPayout) => {
    if (p) {
      setEditingPayout(p);
      setPayoutForm({
        staffId: p.staffId,
        month: p.month,
        basicSalary: p.basicSalary ? String(p.basicSalary) : '',
        overtimeHours: p.overtimeHours ? String(p.overtimeHours) : '',
        overtimeRate: p.overtimeRate ? String(p.overtimeRate) : '',
        bonusAmount: p.bonusAmount ? String(p.bonusAmount) : '',
        deductions: p.deductions ? String(p.deductions) : '',
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        status: p.status,
        reference: p.reference,
        notes: p.notes || '',
      });
    } else {
      setEditingPayout(null);
      const defaultStaff = staff[0];
      setPayoutForm({
        staffId: defaultStaff?.id || '',
        month: selectedMonth,
        basicSalary: defaultStaff?.basicSalary ? String(defaultStaff.basicSalary) : '',
        overtimeHours: '',
        overtimeRate: defaultStaff?.overtimeHourlyRate ? String(defaultStaff.overtimeHourlyRate) : '',
        bonusAmount: '',
        deductions: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'EFT / Bank Transfer',
        status: 'Paid',
        reference: `SAL-${selectedMonth}-${defaultStaff?.employeeCode || '001'}`,
        notes: '',
      });
    }
    setIsPayoutModalOpen(true);
  };

  // When staff is selected in payout modal, auto-populate salary and overtime rate
  const handleSelectStaffForPayout = (staffId: string) => {
    const found = staff.find((s) => s.id === staffId);
    if (found) {
      setPayoutForm((prev) => ({
        ...prev,
        staffId,
        basicSalary: found.basicSalary ? String(found.basicSalary) : '',
        overtimeRate: found.overtimeHourlyRate ? String(found.overtimeHourlyRate) : '',
        reference: `SAL-${payoutForm.month}-${found.employeeCode}`,
      }));
    } else {
      setPayoutForm((prev) => ({ ...prev, staffId }));
    }
  };

  // Submit Staff Form
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name) return;

    const payload: Partial<StaffMember> = {
      employeeCode: staffForm.employeeCode,
      name: staffForm.name,
      idNumber: staffForm.idNumber,
      role: staffForm.role,
      department: staffForm.department,
      phone: staffForm.phone,
      email: staffForm.email,
      employmentType: staffForm.employmentType,
      basicSalary: staffForm.basicSalary === '' ? 0 : Number(staffForm.basicSalary),
      hourlyRate: staffForm.hourlyRate === '' ? 0 : Number(staffForm.hourlyRate),
      overtimeHourlyRate: staffForm.overtimeHourlyRate === '' ? 0 : Number(staffForm.overtimeHourlyRate),
      bankName: staffForm.bankName,
      accountHolder: staffForm.accountHolder || staffForm.name,
      accountNumber: staffForm.accountNumber,
      branchCode: staffForm.branchCode,
      startDate: staffForm.startDate,
      status: staffForm.status,
    };

    if (editingStaff) {
      await updateStaffMember(editingStaff.id, payload);
    } else {
      await createStaffMember(payload);
    }
    setIsStaffModalOpen(false);
  };

  // Submit Payout Form
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const stf = staff.find((s) => s.id === payoutForm.staffId);
    const staffName = stf?.name || 'Staff Member';
    const role = stf?.role || 'Production Staff';

    const payload: Partial<PayrollPayout> = {
      staffId: payoutForm.staffId,
      staffName,
      role,
      month: payoutForm.month,
      basicSalary: payoutForm.basicSalary === '' ? 0 : Number(payoutForm.basicSalary),
      overtimeHours: payoutForm.overtimeHours === '' ? 0 : Number(payoutForm.overtimeHours),
      overtimeRate: payoutForm.overtimeRate === '' ? 0 : Number(payoutForm.overtimeRate),
      bonusAmount: payoutForm.bonusAmount === '' ? 0 : Number(payoutForm.bonusAmount),
      deductions: payoutForm.deductions === '' ? 0 : Number(payoutForm.deductions),
      paymentDate: payoutForm.paymentDate,
      paymentMethod: payoutForm.paymentMethod,
      status: payoutForm.status,
      reference: payoutForm.reference,
      notes: payoutForm.notes,
    };

    if (editingPayout) {
      await updatePayrollPayout(editingPayout.id, payload);
    } else {
      await createPayrollPayout(payload);
    }
    setIsPayoutModalOpen(false);
  };

  // Live Payout Form Totals
  const curBasic = payoutForm.basicSalary === '' ? 0 : Number(payoutForm.basicSalary);
  const curOtHours = payoutForm.overtimeHours === '' ? 0 : Number(payoutForm.overtimeHours);
  const curOtRate = payoutForm.overtimeRate === '' ? 0 : Number(payoutForm.overtimeRate);
  const curOtPay = curOtHours * curOtRate;
  const curBonus = payoutForm.bonusAmount === '' ? 0 : Number(payoutForm.bonusAmount);
  const curDeduct = payoutForm.deductions === '' ? 0 : Number(payoutForm.deductions);
  const curNet = curBasic + curOtPay + curBonus - curDeduct;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#171311] border border-[#2C211B] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-serif text-[#C98A5B] font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-[#DE9E74]" />
            <span>Staff & Payroll Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Salaries, Overtime & Payout Ledger
          </h1>
          <p className="text-xs text-[#A69385] mt-1 max-w-2xl leading-relaxed">
            Calculate and disburse monthly staff salaries, track overtime hours and multipliers,
            and maintain comprehensive payroll records synchronized with Google Cloud.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => openPayoutModal()}
            className="px-4 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Calculate / Record Payout</span>
          </button>

          <button
            type="button"
            onClick={() => openStaffModal()}
            className="px-4 py-2.5 rounded-xl bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] border border-[#3A2D25] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-4 h-4 text-[#C98A5B]" />
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-xl bg-[#171311] border border-[#2C211B]">
          <div className="text-[11px] font-medium text-[#A69385] uppercase tracking-wider flex items-center justify-between">
            <span>Total Salaries Paid</span>
            <DollarSign className="w-4 h-4 text-[#C98A5B]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
            {company.currency} {totalSalariesPaid.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8A776B] mt-1">Disbursed for {selectedMonth}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#171311] border border-[#2C211B]">
          <div className="text-[11px] font-medium text-[#A69385] uppercase tracking-wider flex items-center justify-between">
            <span>Total Overtime Paid</span>
            <Clock className="w-4 h-4 text-[#DE9E74]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#DE9E74] mt-1 tabular-nums">
            {company.currency} {totalOvertimePaid.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8A776B] mt-1">Overtime & night baking shifts</div>
        </div>

        <div className="p-4 rounded-xl bg-[#171311] border border-[#2C211B]">
          <div className="text-[11px] font-medium text-[#A69385] uppercase tracking-wider flex items-center justify-between">
            <span>Pending Payouts</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-amber-300 mt-1 tabular-nums">
            {company.currency} {pendingPayoutsTotal.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8A776B] mt-1">Awaiting EFT release / approval</div>
        </div>

        <div className="p-4 rounded-xl bg-[#171311] border border-[#2C211B]">
          <div className="text-[11px] font-medium text-[#A69385] uppercase tracking-wider flex items-center justify-between">
            <span>Active Staff Members</span>
            <Users className="w-4 h-4 text-[#C98A5B]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
            {staff.filter((s) => s.status === 'Active').length}
          </div>
          <div className="text-[10px] text-[#8A776B] mt-1">Bakery, logistics & sales team</div>
        </div>
      </div>

      {/* Navigation Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-[#2C211B] pb-3 no-print gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'payouts'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Monthly Salary & Overtime Payouts ({payrollPayouts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Directory & Rates ({staff.length})</span>
          </button>
        </div>

        {/* Month Selector */}
        {activeTab === 'payouts' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#A69385]">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-[#171311] border border-[#2C211B] rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
            />
          </div>
        )}
      </div>

      {/* TAB 1: PAYROLL PAYOUTS LIST */}
      {activeTab === 'payouts' && (
        <div className="space-y-4 no-print">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#171311] border border-[#2C211B] rounded-xl p-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A776B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                placeholder="Search staff name, payment reference..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'Paid', 'Pending'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-[#C98A5B] text-[#120F0D] font-bold shadow-xs'
                      : 'text-[#A69385] hover:text-white hover:bg-[#221B17]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Payouts Table */}
          <div className="bg-[#171311] border border-[#2C211B] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#120F0D] border-b border-[#2C211B] text-[#8A776B] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Payout #</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-right">Basic Salary</th>
                    <th className="py-3 px-4 text-right">Overtime</th>
                    <th className="py-3 px-4 text-right">Bonus / Deduct</th>
                    <th className="py-3 px-4 text-right font-bold text-white">Net Payout</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#2C211B] text-[#EDE6DE]">
                  {filteredPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center text-[#8A776B]">
                        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#DE9E74]" />
                        <p className="font-serif text-base text-white font-semibold">No Payout Records Found</p>
                        <p className="text-xs text-[#A69385] mt-1">
                          Click "+ Calculate / Record Payout" to add a salary disbursement for {selectedMonth}.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#221B17]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#DE9E74]">
                          {p.payoutNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{p.staffName}</div>
                          <div className="text-[11px] text-[#8A776B]">{p.role}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#A69385]">
                          {p.month}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-[#C5B7AC]">
                          {company.currency} {(p.basicSalary || 0).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-[#DE9E74]">
                          {p.overtimeHours > 0 ? (
                            <div>
                              <span>+{company.currency} {(p.overtimePay || 0).toFixed(2)}</span>
                              <div className="text-[10px] text-[#8A776B]">({p.overtimeHours}h @ {company.currency}{p.overtimeRate}/h)</div>
                            </div>
                          ) : (
                            <span className="text-[#8A776B]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">
                          {p.bonusAmount > 0 && <span className="text-emerald-400">+{p.bonusAmount.toFixed(2)} </span>}
                          {p.deductions > 0 && <span className="text-rose-400">-{p.deductions.toFixed(2)}</span>}
                          {!p.bonusAmount && !p.deductions && <span className="text-[#8A776B]">-</span>}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white tabular-nums">
                          {company.currency} {(p.netPayout || 0).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              p.status === 'Paid'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPrintingPayout(p)}
                              className="p-1 rounded bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] transition-colors"
                              title="Print Payslip Advice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openPayoutModal(p)}
                              className="p-1 rounded bg-[#221B17] hover:bg-[#2C211B] text-[#EDE6DE] transition-colors"
                              title="Edit Payout"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete payout record ${p.payoutNumber}?`)) {
                                  deletePayrollPayout(p.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="space-y-4 no-print">
          <div className="flex items-center justify-between gap-3 bg-[#171311] border border-[#2C211B] rounded-xl p-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A776B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search staff name, employee code, role..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#120F0D] border border-[#2C211B] rounded-lg text-white placeholder-[#6E5B4F] focus:outline-hidden focus:border-[#C98A5B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full py-16 text-center text-[#8A776B] bg-[#171311] border border-[#2C211B] rounded-2xl">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#DE9E74]" />
                <p className="font-serif text-base text-white font-semibold">No Staff Members Registered</p>
                <p className="text-xs text-[#A69385] mt-1">
                  Click "+ Add Staff Member" to add your bakery, pastry and dispatch team.
                </p>
              </div>
            ) : (
              filteredStaff.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#171311] border border-[#2C211B] rounded-2xl p-5 space-y-3 relative hover:border-[#C98A5B]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-[#DE9E74] font-bold">{s.employeeCode}</span>
                      <h3 className="font-serif font-bold text-base text-white">{s.name}</h3>
                      <div className="text-xs text-[#A69385] flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#C98A5B]" />
                        <span>{s.role}</span>
                        {s.department && <span>· {s.department}</span>}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                        s.status === 'Active'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          : 'bg-[#221B17] text-[#8A776B]'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#2C211B] space-y-1.5 text-xs text-[#C5B7AC]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8A776B]">Base Monthly Salary:</span>
                      <span className="font-mono font-bold text-white">
                        {company.currency} {(s.basicSalary || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#8A776B]">Overtime Rate:</span>
                      <span className="font-mono text-[#DE9E74]">
                        {company.currency} {(s.overtimeHourlyRate || 0).toFixed(2)} / hour
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8A776B]">Phone:</span>
                      <span className="font-mono">{s.phone || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8A776B]">Bank:</span>
                      <span>{s.bankName} (Acc: {s.accountNumber ? `••••${s.accountNumber.slice(-4)}` : '-'})</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#2C211B] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openPayoutModal({
                        id: '',
                        payoutNumber: '',
                        staffId: s.id,
                        staffName: s.name,
                        role: s.role,
                        month: selectedMonth,
                        basicSalary: s.basicSalary,
                        overtimeHours: 0,
                        overtimeRate: s.overtimeHourlyRate,
                        overtimePay: 0,
                        bonusAmount: 0,
                        deductions: 0,
                        netPayout: s.basicSalary,
                        paymentDate: new Date().toISOString().split('T')[0],
                        paymentMethod: 'EFT / Bank Transfer',
                        status: 'Paid',
                        reference: `SAL-${selectedMonth}-${s.employeeCode}`,
                        createdAt: '',
                      })}
                      className="px-2.5 py-1 text-xs bg-[#221B17] hover:bg-[#2C211B] text-[#DE9E74] font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Pay Salary</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openStaffModal(s)}
                      className="p-1.5 rounded-lg text-[#8A776B] hover:text-white hover:bg-[#221B17]"
                      title="Edit Staff"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete staff member ${s.name}?`)) {
                          deleteStaffMember(s.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#8A776B] hover:text-rose-400 hover:bg-[#221B17]"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STAFF CREATE/EDIT MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2C211B] pb-3">
              <div>
                <h3 className="font-serif font-bold text-white text-base">
                  {editingStaff ? 'Edit Staff Member' : 'Register New Staff Member'}
                </h3>
                <p className="text-xs text-[#A69385]">Configure role, basic salary, overtime rate, and banking details.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8A776B] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Employee Code <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.employeeCode}
                    onChange={(e) => setStaffForm({ ...staffForm, employeeCode: e.target.value })}
                    placeholder="STF-001"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Full Name <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="e.g. Sipho Ndlovu"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Job Title / Role <span className="text-[#DE9E74]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    placeholder="e.g. Master Artisan Baker"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Department
                  </label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="Production">Bakery Production</option>
                    <option value="Pastry & Confectionery">Pastry & Confectionery</option>
                    <option value="Dispatch & Logistics">Dispatch & Logistics</option>
                    <option value="Front of House">Front of House / Retail</option>
                    <option value="Cleaning & Sanitation">Sanitation</option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Base Monthly Salary ({company.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={staffForm.basicSalary}
                    onChange={(e) => setStaffForm({ ...staffForm, basicSalary: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Overtime Hourly Rate ({company.currency}/hr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={staffForm.overtimeHourlyRate}
                    onChange={(e) => setStaffForm({ ...staffForm, overtimeHourlyRate: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+27..."
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Status
                  </label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Banking Details */}
              <div className="pt-2 border-t border-[#2C211B]">
                <h4 className="text-[11px] font-serif font-bold text-[#DE9E74] uppercase tracking-wider mb-2">
                  EFT Banking Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#A69385] mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={staffForm.bankName}
                      onChange={(e) => setStaffForm({ ...staffForm, bankName: e.target.value })}
                      placeholder="FNB / Standard Bank"
                      className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#C98A5B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#A69385] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={staffForm.accountNumber}
                      onChange={(e) => setStaffForm({ ...staffForm, accountNumber: e.target.value })}
                      placeholder="62..."
                      className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-[#C98A5B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#A69385] mb-1">Branch Code</label>
                    <input
                      type="text"
                      value={staffForm.branchCode}
                      onChange={(e) => setStaffForm({ ...staffForm, branchCode: e.target.value })}
                      placeholder="250655"
                      className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-[#C98A5B]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2C211B]">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs"
                >
                  {editingStaff ? 'Update Staff Member' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT CALCULATOR MODAL */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#171311] border border-[#2C211B] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2C211B] pb-3">
              <div>
                <h3 className="font-serif font-bold text-white text-base">
                  {editingPayout ? 'Edit Salary & Overtime Record' : 'Calculate Monthly Payout'}
                </h3>
                <p className="text-xs text-[#A69385]">Calculates salary, overtime hours, bonuses and deductions.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8A776B] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayout} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Select Staff Member <span className="text-[#DE9E74]">*</span>
                  </label>
                  <select
                    required
                    value={payoutForm.staffId}
                    onChange={(e) => handleSelectStaffForPayout(e.target.value)}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="">-- Choose employee --</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role}) - Base: {company.currency}{s.basicSalary}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Payroll Month (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    required
                    value={payoutForm.month}
                    onChange={(e) => setPayoutForm({ ...payoutForm, month: e.target.value })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Base Salary Amount ({company.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payoutForm.basicSalary}
                    onChange={(e) => setPayoutForm({ ...payoutForm, basicSalary: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payoutForm.paymentDate}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Overtime Hours Worked (hrs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={payoutForm.overtimeHours}
                    onChange={(e) => setPayoutForm({ ...payoutForm, overtimeHours: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Overtime Rate ({company.currency}/hr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payoutForm.overtimeRate}
                    onChange={(e) => setPayoutForm({ ...payoutForm, overtimeRate: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Bonus / Allowance ({company.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payoutForm.bonusAmount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, bonusAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Deductions ({company.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payoutForm.deductions}
                    onChange={(e) => setPayoutForm({ ...payoutForm, deductions: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payoutForm.paymentMethod}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="EFT / Bank Transfer">EFT / Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                    Disbursement Status
                  </label>
                  <select
                    value={payoutForm.status}
                    onChange={(e) => setPayoutForm({ ...payoutForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white focus:outline-hidden focus:border-[#C98A5B]"
                  >
                    <option value="Paid">Paid / Disbursed</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#EDE6DE] mb-1">
                  EFT Reference / Notes
                </label>
                <input
                  type="text"
                  value={payoutForm.reference}
                  onChange={(e) => setPayoutForm({ ...payoutForm, reference: e.target.value })}
                  placeholder="e.g. SAL-2026-10-STF-001"
                  className="w-full px-3 py-2 bg-[#120F0D] border border-[#2C211B] rounded-lg text-white font-mono focus:outline-hidden focus:border-[#C98A5B]"
                />
              </div>

              {/* Live Calculation Preview Box */}
              <div className="p-4 rounded-xl bg-[#221B17] border border-[#3A2D25] space-y-2">
                <div className="text-[11px] font-serif uppercase tracking-wider text-[#DE9E74] font-bold">
                  Calculation Summary
                </div>
                <div className="flex items-center justify-between text-[#C5B7AC]">
                  <span>Base Salary:</span>
                  <span className="font-mono">{company.currency} {curBasic.toFixed(2)}</span>
                </div>
                {curOtHours > 0 && (
                  <div className="flex items-center justify-between text-[#DE9E74]">
                    <span>Overtime ({curOtHours} hrs × {company.currency}{curOtRate}/hr):</span>
                    <span className="font-mono">+{company.currency} {curOtPay.toFixed(2)}</span>
                  </div>
                )}
                {curBonus > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Bonus:</span>
                    <span className="font-mono">+{company.currency} {curBonus.toFixed(2)}</span>
                  </div>
                )}
                {curDeduct > 0 && (
                  <div className="flex items-center justify-between text-rose-400">
                    <span>Deductions:</span>
                    <span className="font-mono">-{company.currency} {curDeduct.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#3A2D25] flex items-center justify-between font-bold text-white text-sm">
                  <span>Net Payout Total:</span>
                  <span className="font-mono text-base text-[#DE9E74]">{company.currency} {curNet.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C98A5B] hover:bg-[#DE9E74] text-[#120F0D] font-bold text-xs"
                >
                  {editingPayout ? 'Update Payout' : 'Save & Record Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PAYSLIP ADVICE MODAL */}
      {printingPayout && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white text-[#23170F] rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-5 print:p-0 print:shadow-none">
            <div className="flex items-center justify-between border-b pb-4 no-print">
              <span className="font-serif font-bold text-sm">Staff Salary Advice / Payslip</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#C98A5B] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingPayout(null)}
                  className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payslip Document */}
            <div className="border border-[#C98A5B]/40 rounded-xl p-6 bg-[#FAF7F2] space-y-4">
              <div className="flex justify-between items-start border-b pb-4 border-[#C98A5B]/30">
                <div>
                  <h2 className="font-serif font-bold text-lg text-[#23170F]">{company.companyName}</h2>
                  <div className="text-xs text-[#8C5329] font-serif italic">{company.tradingName}</div>
                  <div className="text-[10px] text-neutral-600 mt-1">{company.address}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif font-bold text-sm uppercase text-[#8C5329]">SALARY ADVICE</div>
                  <div className="font-mono text-xs font-semibold">{printingPayout.payoutNumber}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">Period: {printingPayout.month}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase font-semibold">Employee Details</div>
                  <div className="font-bold text-sm mt-0.5">{printingPayout.staffName}</div>
                  <div className="text-neutral-600">{printingPayout.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-neutral-500 text-[10px] uppercase font-semibold">Disbursement Details</div>
                  <div className="font-mono text-xs mt-0.5">Date: {printingPayout.paymentDate}</div>
                  <div className="font-mono text-xs text-[#8C5329]">{printingPayout.paymentMethod}</div>
                  <div className="font-mono text-[10px] text-neutral-500">Ref: {printingPayout.reference}</div>
                </div>
              </div>

              {/* Line Breakdown Table */}
              <table className="w-full text-left text-xs border-collapse border border-[#C98A5B]/30">
                <thead className="bg-[#23170F] text-[#FAF6F0] font-serif text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Details</th>
                    <th className="py-2 px-3 text-right">Amount ({company.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C98A5B]/20 font-mono text-xs">
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium">Basic Salary</td>
                    <td className="py-2 px-3 text-right text-neutral-500 font-sans">Monthly rate</td>
                    <td className="py-2 px-3 text-right font-bold">{printingPayout.basicSalary.toFixed(2)}</td>
                  </tr>
                  {printingPayout.overtimeHours > 0 && (
                    <tr>
                      <td className="py-2 px-3 font-sans font-medium">Overtime Hours</td>
                      <td className="py-2 px-3 text-right text-neutral-500 font-sans">
                        {printingPayout.overtimeHours} hrs @ {company.currency}{printingPayout.overtimeRate}
                      </td>
                      <td className="py-2 px-3 text-right text-[#8C5329] font-bold">{printingPayout.overtimePay.toFixed(2)}</td>
                    </tr>
                  )}
                  {printingPayout.bonusAmount > 0 && (
                    <tr>
                      <td className="py-2 px-3 font-sans font-medium">Bonus / Allowance</td>
                      <td className="py-2 px-3 text-right text-neutral-500 font-sans">Performance</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-bold">+{printingPayout.bonusAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  {printingPayout.deductions > 0 && (
                    <tr>
                      <td className="py-2 px-3 font-sans font-medium">Statutory Deductions</td>
                      <td className="py-2 px-3 text-right text-neutral-500 font-sans">UIF / Advances</td>
                      <td className="py-2 px-3 text-right text-rose-700 font-bold">-{printingPayout.deductions.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-[#23170F] text-white font-bold">
                    <td className="py-2.5 px-3 font-serif uppercase tracking-wider">Net Amount Disbursed</td>
                    <td className="py-2.5 px-3 text-right font-sans text-xs">Status: {printingPayout.status}</td>
                    <td className="py-2.5 px-3 text-right text-base text-[#DE9E74]">{company.currency} {printingPayout.netPayout.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-2 text-[10px] text-center text-neutral-500 italic">
                Confidential payroll record generated by Savouré Enterprise Management System.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
