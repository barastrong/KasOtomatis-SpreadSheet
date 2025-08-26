import React, { useState, useMemo, useEffect, forwardRef, useRef, type ChangeEvent, type FormEvent } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUser, faCalendarDays, faMoneyBillWave, faHashtag, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyAHiFKZ-akyO1E_rsWVaedmxlw9y-edVKtlSpP5OQXDN-ceM1uZRG9CqZLqjrJ2Oxq/exec";
const INITIAL_FORM_STATE = { kelas: "", nama: "" };
const FIXED_AMOUNT = "2000";

type FormStateType = typeof INITIAL_FORM_STATE;
type SiswaDataType = Record<string, string[]>;
type FormStatusType = { isLoading: boolean; message: string | null; type: 'success' | 'error' | null; };
type PaymentMethodType = 'specific_date' | 'arrears' | 'advance';
type AmountOptionType = 'fixed' | 'custom';

type Payload = {
    kelas: string;
    nama: string;
    isNewStudent: boolean;
    paymentMethod?: PaymentMethodType;
    tanggal?: string;
    jumlah?: string;
    count?: number;
};

const ChevronDownIcon = () => (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const FormField = ({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        {children}
    </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { icon?: React.ReactNode; }

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) =>
    <input
        ref={ref}
        {...props}
        className={`block w-full px-4 py-2.5 text-gray-800 bg-white border border-gray-300 rounded-lg placeholder-gray-400/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:opacity-70 ${props.icon ? "pl-11" : "pl-4"}`}
    />
);

const IconInput = forwardRef<HTMLInputElement, InputProps>(({ icon, ...props }, ref) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 w-5 h-full">
            {icon}
        </div>
        <Input ref={ref} {...props} icon={icon} />
    </div>
));

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { icon?: React.ReactNode; }

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ icon, children, ...props }, ref) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 w-5 h-full">
            {icon}
        </div>
        <select
            ref={ref}
            {...props}
            className="appearance-none block w-full pl-11 pr-10 py-2.5 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <ChevronDownIcon />
        </div>
    </div>
));

const StatusMessage = ({ type, message }: { type: FormStatusType['type'], message: string | null }) => {
    if (!type || !message) return null;
    const config = {
        success: { bgColor: "bg-green-50 border-green-400", textColor: "text-green-800", icon: <FontAwesomeIcon icon={faCircleCheck} /> },
        error: { bgColor: "bg-red-50 border-red-400", textColor: "text-red-800", icon: <FontAwesomeIcon icon={faCircleXmark} /> },
    };
    const currentConfig = config[type];
    return (
        <div className={`flex items-center space-x-3 p-4 text-sm rounded-lg border ${currentConfig.bgColor} ${currentConfig.textColor}`} role="alert">
            <span className="text-xl">{currentConfig.icon}</span>
            <span className="font-medium">{message}</span>
        </div>
    );
};

const formatRp = (value: string | number) => {
    if (!value && value !== 0) return "";
    const numberValue = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
    if (isNaN(numberValue)) return "";
    return `Rp ${numberValue.toLocaleString('id-ID')}`;
};

export default function KasForm() {
    const [formData, setFormData] = useState<FormStateType>(INITIAL_FORM_STATE);
    const [siswaData, setSiswaData] = useState<SiswaDataType>({});
    const [isSiswaLoading, setIsSiswaLoading] = useState(true);
    const [isNewStudent, setIsNewStudent] = useState(false);
    const [formStatus, setFormStatus] = useState<FormStatusType>({ isLoading: false, message: null, type: null });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('specific_date');
    const [specificDate, setSpecificDate] = useState("");
    const [amountOption, setAmountOption] = useState<AmountOptionType>('fixed');
    const [customAmount, setCustomAmount] = useState("");
    const [paymentCount, setPaymentCount] = useState("1");
    const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSiswaData = async () => {
            setIsSiswaLoading(true);
            setFormStatus({ isLoading: false, message: null, type: null });
            try {
                const response = await fetch(WEB_APP_URL);
                if (!response.ok) throw new Error("Gagal mengambil data dari server.");
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setSiswaData(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
                setFormStatus({ isLoading: false, message: `Gagal memuat data siswa: ${message}`, type: "error" });
            } finally {
                setIsSiswaLoading(false);
            }
        };
        if (!isNewStudent) fetchSiswaData();
    }, [isNewStudent]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsNameDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (formStatus.type === 'success' && formStatus.message) {
            const timer = setTimeout(() => {
                setFormStatus({ isLoading: false, message: null, type: null });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [formStatus]);

    const namaSiswaOptions = useMemo(() => formData.kelas ? siswaData[formData.kelas]?.sort() || [] : [], [formData.kelas, siswaData]);
    const filteredNamaOptions = useMemo(() => formData.nama ? namaSiswaOptions.filter(name => name.toLowerCase().includes(formData.nama.toLowerCase())) : namaSiswaOptions, [formData.nama, namaSiswaOptions]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value, ...(id === "kelas" && !isNewStudent && { nama: "" }) }));
        if (id === "nama") setIsNameDropdownOpen(true);
        if (formStatus.message) setFormStatus({ isLoading: false, message: null, type: null });
    };

    const handleNameSelect = (name: string) => {
        setFormData(prev => ({ ...prev, nama: name }));
        setIsNameDropdownOpen(false);
    };

    const handleToggleMode = () => {
        setIsNewStudent(prev => !prev);
        setFormData(INITIAL_FORM_STATE);
        setFormStatus({ isLoading: false, message: null, type: null });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.kelas || !formData.nama) {
            setFormStatus({ isLoading: false, message: "Kelas dan Nama wajib diisi.", type: 'error' });
            return;
        }

        setFormStatus({ isLoading: true, message: null, type: null });

        const payload: Payload = { ...formData, paymentMethod, isNewStudent };

        if (!isNewStudent) {
            if (paymentMethod === 'specific_date') {
                const finalJumlah = amountOption === 'fixed' ? FIXED_AMOUNT : customAmount.replace(/[^0-9]/g, '');
                if (!specificDate || !finalJumlah) {
                    setFormStatus({ isLoading: false, message: "Tanggal dan Jumlah wajib diisi.", type: 'error' });
                    return;
                }
                payload.tanggal = specificDate;
                payload.jumlah = finalJumlah;
            } else {
                const count = parseInt(paymentCount, 10);
                if (!specificDate || isNaN(count) || count < 1) {
                    setFormStatus({ isLoading: false, message: "Tanggal dan jumlah pembayaran valid wajib diisi.", type: "error" });
                    return;
                }
                payload.tanggal = specificDate;
                payload.count = count;
            }
        }

        try {
            const response = await fetch(WEB_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (response.ok && result.status === "success") {
                setFormStatus({ isLoading: false, message: result.message, type: "success" });
                setFormData(INITIAL_FORM_STATE);
                setPaymentCount("1"); setSpecificDate(""); setCustomAmount(""); setAmountOption('fixed');
                if (isNewStudent) setIsNewStudent(false);
            } else {
                throw new Error(result.message || "Terjadi kesalahan dari server.");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
            setFormStatus({ isLoading: false, message: `Gagal: ${message}`, type: "error" });
        }
    };

    const getButtonClass = (method: PaymentMethodType) =>
        `p-3 text-center rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${paymentMethod === method ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`;

    const getTanggalLabel = () => {
        if (paymentMethod === 'arrears') return "Bayar Tunggakan (Acuan Tanggal Terakhir)";
        if (paymentMethod === 'advance') return "Mulai Bayar dari Tanggal";
        return "Tanggal Pembayaran";
    };

    const isButtonDisabled = formStatus.isLoading || isSiswaLoading;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans antialiased">
            <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 space-y-6">
                <header className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isNewStudent ? "Tambah Siswa Baru" : "Formulir Uang Kas"}</h1>
                    <p className="text-gray-500 mt-2">{isNewStudent ? "Daftarkan siswa baru ke dalam sistem." : "Catat pembayaran uang kas ekskul."}</p>
                </header>

                <div className="relative flex items-center justify-center pt-4">
                    <div className="absolute inset-x-0 h-px bg-gray-200"></div>
                    <button onClick={handleToggleMode} className="relative z-10 text-sm font-semibold text-indigo-600 bg-white px-4 py-1.5 border border-gray-300 rounded-full hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {isNewStudent ? "Batal & Kembali" : "Daftarkan Siswa Baru?"}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isNewStudent ? (
                        <>
                            <FormField label="Kelas Baru" id="kelas">
                                <IconInput id="kelas" type="text" value={formData.kelas} onChange={handleChange} required disabled={formStatus.isLoading} placeholder="Contoh: X SIJA 1" icon={<FontAwesomeIcon icon={faUsers} />} />
                            </FormField>
                            <FormField label="Nama Siswa Baru" id="nama">
                                <IconInput id="nama" type="text" value={formData.nama} onChange={handleChange} required disabled={formStatus.isLoading} placeholder="Contoh: Budi Hartono" icon={<FontAwesomeIcon icon={faUser} />} />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <FormField label="Kelas" id="kelas">
                                <Select id="kelas" value={formData.kelas} onChange={handleChange} required disabled={isSiswaLoading || formStatus.isLoading} icon={<FontAwesomeIcon icon={faUsers} />}>
                                    <option value="" disabled>{isSiswaLoading ? "Memuat kelas..." : "-- Pilih Kelas --"}</option>
                                    {Object.keys(siswaData).sort().map((k) => <option key={k} value={k}>{k}</option>)}
                                </Select>
                            </FormField>

                            <FormField label="Cari Nama Siswa" id="nama">
                                <div className="relative" ref={searchRef}>
                                    <IconInput id="nama" type="text" value={formData.nama} onChange={handleChange} onFocus={() => setIsNameDropdownOpen(true)} required disabled={!formData.kelas || formStatus.isLoading} placeholder="Ketik untuk mencari nama..." icon={<FontAwesomeIcon icon={faUser} />} autoComplete="off" />
                                    {isNameDropdownOpen && filteredNamaOptions.length > 0 && (
                                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredNamaOptions.map((name) => (
                                                <li key={name} onClick={() => handleNameSelect(name)} className="px-4 py-2.5 text-gray-800 cursor-pointer hover:bg-indigo-50 transition-colors">{name}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </FormField>

                            <FormField label="Metode Pembayaran">
                                <div className="grid grid-cols-3 gap-3">
                                    <button type="button" onClick={() => setPaymentMethod('specific_date')} className={getButtonClass('specific_date')}>Hari Ini</button>
                                    <button type="button" onClick={() => setPaymentMethod('arrears')} className={getButtonClass('arrears')}>Tunggakan</button>
                                    <button type="button" onClick={() => setPaymentMethod('advance')} className={getButtonClass('advance')}>Kedepannya</button>
                                </div>
                            </FormField>

                            <FormField label={getTanggalLabel()} id="tanggal">
                                <IconInput id="tanggal" type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} required disabled={formStatus.isLoading} icon={<FontAwesomeIcon icon={faCalendarDays} />} />
                            </FormField>

                            {paymentMethod !== 'specific_date' && (
                                <FormField label="Berapa Kali Bayar?" id="paymentCount">
                                    <IconInput id="paymentCount" type="number" min="1" value={paymentCount} onChange={(e) => setPaymentCount(e.target.value)} required disabled={formStatus.isLoading} icon={<FontAwesomeIcon icon={faHashtag} />} />
                                </FormField>
                            )}

                            {paymentMethod === 'specific_date' && (
                                <FormField label="Jumlah Kas">
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${amountOption === 'fixed' ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                                            <input type="radio" name="amount" value="fixed" checked={amountOption === 'fixed'} onChange={() => setAmountOption('fixed')} className="sr-only" />
                                            <span className="text-lg text-gray-800">{formatRp(FIXED_AMOUNT)}</span>
                                            <span className="text-sm text-gray-500">Jumlah Tetap</span>
                                        </label>
                                        <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${amountOption === 'custom' ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                                            <input type="radio" name="amount" value="custom" checked={amountOption === 'custom'} onChange={() => setAmountOption('custom')} className="sr-only" />
                                            <span className="text-lg  text-gray-800">Lainnya</span>
                                            <span className="text-sm text-gray-500">Jumlah Kustom</span>
                                        </label>
                                    </div>
                                    {amountOption === 'custom' && (
                                        <div className="mt-3">
                                            <IconInput id="jumlah" type="text" inputMode="numeric" value={formatRp(customAmount)} onChange={(e) => setCustomAmount(e.target.value)} required disabled={formStatus.isLoading} placeholder="Contoh: 5000" icon={<FontAwesomeIcon icon={faMoneyBillWave} />} />
                                        </div>
                                    )}
                                </FormField>
                            )}
                        </>
                    )}

                    <div className="pt-2">
                        <StatusMessage type={formStatus.type} message={formStatus.message} />
                    </div>

                    <button type="submit" disabled={isButtonDisabled} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-wait">
                        {formStatus.isLoading && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {formStatus.isLoading ? "Memproses..." : (isNewStudent ? "Tambah Siswa" : "Simpan Pembayaran")}
                    </button>
                </form>
            </div>
        </div>
    );
}