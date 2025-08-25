import React, { useState, useMemo, useEffect, forwardRef, useRef, type ChangeEvent, type  FormEvent } from "react";

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyAHiFKZ-akyO1E_rsWVaedmxlw9y-edVKtlSpP5OQXDN-ceM1uZRG9CqZLqjrJ2Oxq/exec";
const INITIAL_FORM_STATE = { kelas: "", nama: "", tanggal: "", jumlah: "" };

type FormStateType = typeof INITIAL_FORM_STATE;
type SiswaDataType = Record<string, string[]>;
type FormStatusType = {
  isLoading: boolean;
  message: string | null;
  type: 'success' | 'error' | null;
};

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>;

const ClassIcon = (props: React.SVGProps<SVGSVGElement>) => 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.781-4.121M12 10.875a4 4 0 100-5.292M12 10.875a4 4 0 110-5.292" />
    </svg>;

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>;

const MoneyIcon = (props: React.SVGProps<SVGSVGElement>) => 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>;

const FormField = ({ label, id, children }: { label: string; id: string; children: React.ReactNode }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { icon?: React.ReactNode; }

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => 
    <input ref={ref} {...props} className={`block w-full px-4 py-2.5 text-gray-800 bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:opacity-70 ${props.icon ? "pl-11" : ""}`} />);

const IconInput = ({ icon, ...props }: InputProps) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
    <Input {...props} icon={icon} />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { icon?: React.ReactNode; }
const Select = forwardRef<HTMLSelectElement, SelectProps>(({ icon, children, ...props }, ref) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
        <select ref={ref} {...props} className="appearance-none block w-full pl-11 pr-10 py-2.5 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed">{children}</select>
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        </div>
  </div>
));

const StatusMessage = ({ type, message }: { type: FormStatusType['type'], message: string | null }) => {
  if (!type || !message) return null;
  const config = {
    success: { 
        bgColor: "bg-green-50 border-green-400", textColor: "text-green-800", icon: 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg> 
    },
    error: { 
        bgColor: "bg-red-50 border-red-400", textColor: "text-red-800", icon: 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg> 
    },
  };

  const currentConfig = config[type];
  return (
    <div className={`flex items-center space-x-3 p-4 text-sm rounded-lg border ${currentConfig.bgColor} ${currentConfig.textColor}`} role="alert">
      {currentConfig.icon}<span className="font-medium">{message}</span>
    </div>
  );
};

const formatRp = (value: string | number) => {
  if (!value) return "";
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
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSiswaData = async () => {
      setIsSiswaLoading(true); setFormStatus({ isLoading: false, message: null, type: null });
      try {
        const response = await fetch(WEB_APP_URL);
        if (!response.ok) throw new Error("Gagal mengambil data dari server.");
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setSiswaData(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
        setFormStatus({ isLoading: false, message: `Gagal memuat data siswa: ${message}`, type: "error" });
      } finally { setIsSiswaLoading(false); }
    };
    if (!isNewStudent) fetchSiswaData();
  }, [isNewStudent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) { setIsNameDropdownOpen(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const namaSiswaOptions = useMemo(() => formData.kelas ? siswaData[formData.kelas]?.sort() || [] : [], [formData.kelas, siswaData]);

  const filteredNamaOptions = useMemo(() => formData.nama ? namaSiswaOptions.filter(name => name.toLowerCase().includes(formData.nama.toLowerCase())) : namaSiswaOptions, [formData.nama, namaSiswaOptions]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;

    if (id === "jumlah") {

      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, [id]: numericValue }));

    } else {

      setFormData((prev) => ({ ...prev, [id]: value, ...(id === "kelas" && !isNewStudent && { nama: "" }) }));

    }
    if (id === "nama") setIsNameDropdownOpen(true);
    if (formStatus.message) setFormStatus({ isLoading: false, message: null, type: null });
  };
  
  const handleNameSelect = (name: string) => { setFormData(prev => ({ ...prev, nama: name })); setIsNameDropdownOpen(false); };
  const handleToggleMode = () => { setIsNewStudent(prev => !prev); setFormData(INITIAL_FORM_STATE); };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setFormStatus({ isLoading: true, message: null, type: null });
    try {
      const response = await fetch(WEB_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...formData, isNewStudent }) });
      const result = await response.json();
      if (response.ok && result.status === "success") {
        setFormStatus({ isLoading: false, message: result.message, type: "success" });
        setFormData(INITIAL_FORM_STATE);
        if (isNewStudent) {
            setIsNewStudent(false);
        }
      } else { throw new Error(result.message || "Terjadi kesalahan dari server."); }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFormStatus({ isLoading: false, message: `Gagal: ${message}`, type: "error" });
    }
  };

  const { isLoading, message, type } = formStatus;
  const isFormDisabled = isLoading || isSiswaLoading;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans antialiased">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isNewStudent ? "Tambah Siswa Baru" : "Formulir Uang Kas"}</h1>
          <p className="text-gray-500 mt-2">{isNewStudent ? "Daftarkan siswa baru ke dalam sistem." : "Catat pembayaran uang kas ekskul."}</p>
        </div>
        <div className="relative flex items-center justify-center pt-4">
          <div className="absolute inset-x-0 h-px bg-gray-200"></div>
          <button onClick={handleToggleMode} className="relative z-10 text-sm font-semibold text-indigo-600 bg-white px-4 py-1.5 border border-gray-300 rounded-full hover:bg-indigo-50 transition-colors">{isNewStudent ? "Batal & Kembali ke Pembayaran" : "Daftarkan Siswa Baru?"}</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {isNewStudent ? (
            <>
              <FormField label="Kelas Baru" id="kelas">
                <IconInput id="kelas" type="text" value={formData.kelas} onChange={handleChange} required disabled={isLoading} placeholder="Contoh: X IPA 1" icon={<ClassIcon />} /></FormField>
              <FormField label="Nama Siswa Baru" id="nama">
                <IconInput id="nama" type="text" value={formData.nama} onChange={handleChange} required disabled={isLoading} placeholder="Contoh: Budi Hartono" icon={<UserIcon />} />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Kelas" id="kelas">
                <Select id="kelas" value={formData.kelas} onChange={handleChange} required disabled={isFormDisabled} icon={<ClassIcon />}>
                  <option value="" disabled>{isSiswaLoading ? "Memuat kelas..." : "-- Pilih Kelas --"}</option>
                  {Object.keys(siswaData).sort().map((k) => <option key={k} value={k}>{k}</option>)}
                </Select>
              </FormField>
              <FormField label="Cari Nama Siswa" id="nama">
                <div className="relative" ref={searchRef}>
                  <IconInput id="nama" type="text" value={formData.nama} onChange={handleChange} onFocus={() => setIsNameDropdownOpen(true)} required disabled={!formData.kelas || isLoading} placeholder="Ketik untuk mencari nama..." icon={<UserIcon />} autoComplete="off" />
                  {isNameDropdownOpen && filteredNamaOptions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredNamaOptions.map((name) => ( <li key={name} onClick={() => handleNameSelect(name)} className="px-4 py-2.5 text-gray-800 cursor-pointer hover:bg-indigo-50 transition-colors">{name}</li> ))}
                    </ul>
                  )}
                </div>
              </FormField>
              <FormField label="Tanggal Pembayaran" id="tanggal"><IconInput id="tanggal" type="date" value={formData.tanggal} onChange={handleChange} required disabled={isLoading} icon={<CalendarIcon />} /></FormField>
              <FormField label="Jumlah Kas" id="jumlah"><IconInput id="jumlah" type="text" inputMode="numeric" value={formatRp(formData.jumlah)} onChange={handleChange} required disabled={isLoading} placeholder="Contoh: Rp 5.000" icon={<MoneyIcon />} /></FormField>
            </>
          )}
          <div className="pt-2"><StatusMessage type={type} message={message} /></div>
          <button type="submit" disabled={isFormDisabled} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-wait hover:scale-105 active:scale-100 disabled:scale-100">
            {isLoading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        )}
            {isLoading ? "Memproses..." : (isNewStudent ? "Tambah Siswa" : "Simpan Pembayaran")}
          </button>
        </form>
      </div>
    </div>
  );
}