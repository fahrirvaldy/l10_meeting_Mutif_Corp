import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import PdfComponent from './PdfComponent';
import { doc, onSnapshot, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';

// 1. Helper untuk mendapatkan ID dokumen berdasarkan tanggal (YYYY-MM-DD)
const getDocId = (date = new Date()) => {
  const d = new Date(date);
  // Menggunakan locale en-CA untuk format YYYY-MM-DD yang konsisten
  return d.toLocaleDateString('en-CA');
};

const getCurrentDate = () => {
  const today = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
};

// --- INITIAL DATA ---
const INITIAL_STATE = {
  meetingDate: getCurrentDate(),
  attendances: [
    { id: 1, name: 'Owner', checked: false },
    { id: 2, name: 'Digital Marketing Supervisor', checked: false },
    { id: 3, name: 'Social Media Specialist', checked: false },
    { id: 4, name: 'Marketplace Specialist', checked: false },
    { id: 5, name: 'Meta Ads', checked: false},
    { id: 6, name: 'KOL - Affiliate Specialist', checked: false},
    { id: 7, name: 'Marketing Campaign', checked: false}
  ],
  goodNews: { owner: '', integrator: '', team: '' },
  scorecardTitles: {
    marketingKPI: 'Digital Marketing Supervisor',
    sosialKPI: 'Social Media Specialist',
    mpsKPI: 'Marketplace Specialist',
    metaKPI: 'Meta Ads',
    kolKPI: 'KOL - Affiliate',
    campaignKPI: 'Marketing Campaign',
  },
  marketingKPI: [
    { kpi: 'Omzet Total', target: 'Rp 273,751,236', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Produk Terjual/Minggu', target: '2961', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Leads Baru/Minggu', target: '388', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Konversi Leads', target: '10%', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Rasio Iklan (ACOS)', target: '10.00%', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'ROAS Rata-Rata', target: '8.00', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'WA Story', target: '6', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Repeat Order', target: '5.00%', real: '', jenis: 'lagging', status: 'on' },
  ],
  sosialKPI: [
    { kpi: 'Konten Tayang vs Rencana', target: '100%', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Hari aktif story & repost mitra', target: '6 Hari/Minggu', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Kesiapan bahan launching', target: 'Siap H-7', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Ketepatan Request Tim Lain', target: '>90% On-Time', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Content Plan Mingguan', target: '1 Dokumen/Minggu', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Kerjasama/Kolaborasi Brand', target: '1 Brand', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Total jangkauan audiens', target: 'Berjalan', real: '', jenis: 'lagging', status: 'on' },
  ],
  mpsKPI: [
    { kpi: 'Riset & Usulan Produk', target: '4 Produk/Minggu', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Pembuatan Mockup', target: '4 Mockup/Minggu', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Tes Pasar', target: 'Selesai < 30 Des 25', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Tugas RnD & Desain Mingguan', target: '100% Sesuai List', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Sampel Produk Puller', target: '6 Produk', real: '', jenis: 'leading', status: 'on' },
  ],
  metaKPI: [
    { kpi: 'Lead time PO ke Vendor', target: '<2 hari kerja', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Disiplin Update Sistem', target: '>95% Terupdate', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Monitoring Vendor', target: '>90% Termonitor', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'SKU Prioritas Stok Aman', target: '>90% Stok Aman', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Proyek Produksi On-time', target: '>80% On-Time', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Variansi Biaya vs Target FOB', target: '<+5% Biaya', real: '', jenis: 'lagging', status: 'on' },
  ],
  kolKPI: [
    { kpi: 'Laporan Kas Harian Tepat Waktu', target: '>90% Terlapor', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Rekap Cashflow + Prioritas Bayar', target: '100% Terekap', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Selisih Saldo Bank vs Catatan', target: '<1% Selisih Harian', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Proses Pengajuan hingga Cair', target: '<2 Hari Kerja', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'LPJ Lengkap', target: '<7 Hari', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Porsi Pengeluaran di Luar Rencana', target: '<10% / Minggu', real: '', jenis: 'lagging', status: 'on' },
  ],
  campaignKPI: [
    { kpi: 'Jumlah Pesanan Diproses', target: '100 Diproses', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Pengiriman Tepat Waktu', target: '>95% Tepat Waktu', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Ketepatan Stok Barang', target: '>97% Sesuai', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Laporan Harian Retur, Gagal, Cancel', target: '100% Terlapor', real: '', jenis: 'leading', status: 'on' },
    { kpi: 'Produktivitas Rata-Rata per Orang', target: '>80 Nota / Hari', real: '', jenis: 'lagging', status: 'on' },
    { kpi: 'Total Lembur', target: 'Tercatat Jika Ada', real: '', jenis: 'lagging', status: 'on' },
  ],
  rockReview: [
    { owner: 'Owner', rock: 'KPI On-Track & Kas Akhir 4M', status: 'on', note: '' },
    { owner: 'Marketing', rock: 'Target sales >-2M/bulan', status: 'on', note: '' },
    { owner: 'Creative', rock: '>10 konten/minggu, ER by Reach 1% + View konten >1000', status: 'on', note: '' },
    { owner: 'RnD', rock: 'Riset 4 Prod & 4 Mockup/Mgg', status: 'on', note: '' },
    { owner: 'Finance', rock: 'EBITDA>-Rp 2,5M, akurasi harian', status: 'on', note: '' },
    { owner: 'Gudang', rock: 'SLA <24 Jam, error <0,1%', status: 'on', note: '' },
  ],
  headlines: {
    customer: ['', '', ''],
    internal: ['', '', ''],
  },
  todoList: [
    { text: '', owner: '', outcome: 'not' },
    { text: '', owner: '', outcome: 'not' },
    { text: '', owner: '', outcome: 'not' },
  ],
  ids: {
    issues: [],
    notes: 'Catat poin diskusi di sini...',
    solutions: '- Solusi 1 (Owner/Deadline)\n- Solusi 2',
  },
  ratings: {}
};

// --- COMPONENTS ---
const Editable = ({ value, onChange, placeholder, className, style, id }) => {
  return (
    <textarea
      id={id}
      className={`w-full bg-transparent border-none outline-none resize-none font-inherit text-inherit font-inherit overflow-hidden p-0 m-0 block leading-[1.5] ${className}`}
      style={style}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      onInput={(e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      }}
      onFocus={(e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      }}
    />
  );
};

const StatusButton = ({ status, onClick }) => (
  <div className={`status-btn ${status === 'on' ? 'on' : 'off'}`} onClick={onClick} />
);

const JenisButton = ({ jenis, onClick }) => (
  <div className={`jenis-btn ${jenis}`} onClick={onClick} />
);

const OutcomeButton = ({ outcome, onClick }) => (
  <div className={`outcome-btn ${outcome === 'done' ? 'done' : 'not'}`} onClick={onClick} />
);

const cycleJenis = (current) => {
  const options = ['lagging', 'leading', 'kualitas'];
  const idx = options.indexOf(current);
  return options[(idx + 1) % options.length];
};

// --- UTILS ---
const removeIndex = (array, index) => {
  const newArray = [...array];
  newArray.splice(index, 1);
  return newArray;
};

function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [data, setData] = useState(INITIAL_STATE);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [cloudMsg, setCloudMsg] = useState('Menghubungkan...');
  const [cloudStatus, setCloudStatus] = useState('saving');
  const [activeDate, setActiveDate] = useState(getDocId());
  const componentRef = useRef();

  // Gembok Pintar untuk Auto-Save
  const isReceivingData = useRef(true);
  const saveTimeoutRef = useRef(null);
  const gembokTimeoutRef = useRef(null);
  const autoLoadTriedRef = useRef(null);

  // Muat Data Rapat Terakhir (Paling Dekat Sebelum Hari Ini)
  const loadYesterdayData = async () => {
    try {
      setCloudMsg('Menyiapkan Template Rapat...');
      
      // Query mencari 1 dokumen yang ID-nya < activeDate, diurutkan paling baru
      const meetingsRef = collection(db, 'meetings');
      const q = query(
        meetingsRef, 
        where('__name__', '<', activeDate), 
        orderBy('__name__', 'desc'), 
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0];
        const lastData = lastDoc.data();
        
        // Reset beberapa field untuk rapat hari ini
        const newData = {
          ...lastData,
          meetingDate: getCurrentDate(),
          ratings: {},
          goodNews: { owner: '', integrator: '', team: '' },
        };
        
        setData(newData);
        setCloudMsg(`Data ${lastDoc.id} dimuat`);
        setCloudStatus('saved');
      } else {
        alert('Tidak ada data rapat sebelumnya ditemukan.');
        setCloudMsg('Data tak ditemukan');
      }
    } catch (error) {
      console.error(error);
      setCloudMsg('Gagal memuat');
      setCloudStatus('error');
    } finally {
      setIsDataLoaded(true);
      isReceivingData.current = false;
    }
  };

  // Interval untuk memantau pergantian hari
  useEffect(() => {
    const timer = setInterval(() => {
      const todayId = getDocId();
      if (todayId !== activeDate) {
        setActiveDate(todayId);
      }
    }, 60000); // Cek setiap menit
    return () => clearInterval(timer);
  }, [activeDate]);

  // 1. DENGARKAN PERUBAHAN DARI FIREBASE
  useEffect(() => {
    setIsDataLoaded(false);
    setCloudMsg('Menghubungkan...');
    
    const meetingDocRef = doc(db, 'meetings', activeDate);
    const unsubscribe = onSnapshot(meetingDocRef, (docSnap) => {
      isReceivingData.current = true;

      if (docSnap.exists()) {
        const serverData = docSnap.data();
        setData(serverData);
        setIsDataLoaded(true);
        setCloudMsg('Terhubung & Sinkron');
        setCloudStatus('saved');
      } else {
        // Jika dokumen hari ini tidak ada, panggil loadYesterdayData otomatis (hanya sekali)
        if (autoLoadTriedRef.current !== activeDate) {
          autoLoadTriedRef.current = activeDate;
          setCloudMsg('Menyiapkan Template Rapat...');
          loadYesterdayData();
        } else {
          setData({ ...INITIAL_STATE, meetingDate: getCurrentDate() });
          setIsDataLoaded(true);
          isReceivingData.current = false;
          setCloudMsg('Terhubung & Sinkron');
          setCloudStatus('saved');
        }
      }

      // Jika data ada, beri jeda sedikit sebelum membuka gembok
      if (docSnap.exists()) {
        if (gembokTimeoutRef.current) clearTimeout(gembokTimeoutRef.current);
        gembokTimeoutRef.current = setTimeout(() => {
          isReceivingData.current = false;
        }, 500);
      }
    });

    return () => {
      unsubscribe();
      if (gembokTimeoutRef.current) clearTimeout(gembokTimeoutRef.current);
    };
  }, [activeDate]);

  // 2. SISTEM AUTO-SAVE PINTAR (Debounced)
  useEffect(() => {
    if (!isDataLoaded || isReceivingData.current) return;

    setCloudMsg('Mengetik...');
    setCloudStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      console.log('Mencoba menyimpan ke:', activeDate);
      const meetingDocRef = doc(db, 'meetings', activeDate);
      
      // Kirim data secara asinkron tanpa 'await' untuk mencegah blocking UI
      setDoc(meetingDocRef, data, { merge: true })
        .then(() => {
          setCloudMsg('Tersimpan di Cloud');
          setCloudStatus('saved');
        })
        .catch((error) => {
          console.error("Save error:", error);
          setCloudMsg('Gagal Menyimpan');
          setCloudStatus('error');
        });
    }, 1000); // Sedikit menambah delay debounce agar tidak terlalu sering hit Firestore

    return () => clearTimeout(saveTimeoutRef.current);
  }, [data, isDataLoaded, activeDate]);

  // --- ACTIONS PURE STATE ---
  const handleAddAttendance = () => {
    setData(prev => {
      const newId = prev.attendances.length > 0 ? Math.max(...prev.attendances.map(a => a.id)) + 1 : 1;
      return {
        ...prev,
        attendances: [...prev.attendances, { id: newId, name: '', checked: false }]
      };
    });
  };

  const handleDeleteAttendance = (id) => {
    setData(prev => {
      const newRatings = { ...prev.ratings };
      delete newRatings['rating_id_' + id];
      return {
        ...prev,
        attendances: prev.attendances.filter(a => a.id !== id),
        ratings: newRatings
      };
    });
  };

  const handleUpdateAttendance = (id, field, value) => {
    setData(prev => {
      const newRatings = { ...prev.ratings };
      if (field === 'checked' && value === false) {
        delete newRatings['rating_id_' + id];
      }
      return {
        ...prev,
        attendances: prev.attendances.map(a => a.id === id ? { ...a, [field]: value } : a),
        ratings: newRatings
      };
    });
  };

  const updateData = (path, value) => {
    setData((prev) => {
      const keys = path.split('.');
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      }
      if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: value
          }
        };
      }
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const updateListItem = (listKey, index, field, value) => {
    setData((prev) => {
      const newList = [...prev[listKey]];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [listKey]: newList };
    });
  };

  const addRow = (listKey, template) => {
    setData((prev) => ({ ...prev, [listKey]: [...prev[listKey], template] }));
  };

  const deleteListItem = (listKey, index) => {
    setData((prev) => ({ ...prev, [listKey]: removeIndex(prev[listKey], index) }));
  };

  const deleteHeadline = (type, index) => {
    setData((prev) => ({
      ...prev,
      headlines: {
        ...prev.headlines,
        [type]: removeIndex(prev.headlines[type], index)
      }
    }));
  };

  const deleteIssue = (index) => {
    setData((prev) => ({
      ...prev,
      ids: {
        ...prev.ids,
        issues: removeIndex(prev.ids.issues, index)
      }
    }));
  };

  const addIssue = () => {
    setData(prev => ({
      ...prev,
      ids: { ...prev.ids, issues: [...prev.ids.issues, { text: 'Masalah baru...', checked: false }] }
    }));
  };

  const populateIDS = () => {
    const currentlyOffTrack = [];
    const currentlyOnTrack = [];

    ['marketingKPI', 'sosialKPI', 'mpsKPI', 'metaKPI', 'kolKPI', 'campaignKPI', 'rockReview'].forEach(key => {
      if (data[key]) {
        data[key].forEach(item => {
          const text = item.kpi || item.rock;
          if (text) {
            if (item.status === 'off') {
              currentlyOffTrack.push({ text, source: key === 'rockReview' ? 'Rocks' : 'Scorecard' });
            } else {
              currentlyOnTrack.push(text);
            }
          }
        });
      }
    });

    setData(prev => {
      const filteredIssues = prev.ids.issues.filter(issue => !currentlyOnTrack.includes(issue.text));
      const existingTexts = filteredIssues.map(i => i.text);
      const newIssues = currentlyOffTrack
        .filter(item => !existingTexts.includes(item.text))
        .map(item => ({ text: item.text, source: item.source, checked: false }));

      return {
        ...prev,
        ids: {
          ...prev.ids,
          issues: [...filteredIssues, ...newIssues]
        }
      };
    });
  };
  const nextSlide = () => {
    if (currentSlide < 12) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  // --- LOGIC CALCULATIONS ---
  const getRelevantRatings = () => {
    return data.attendances
      .map(a => parseFloat(data.ratings['rating_id_' + a.id]))
      .filter(v => !isNaN(v) && v > 0);
  };

  const relevantRatings = getRelevantRatings();
  const averageRaw = relevantRatings.length 
    ? (relevantRatings.reduce((a, b) => a + b, 0) / relevantRatings.length) 
    : 0;
  const averageRating = parseFloat(averageRaw.toFixed(1));

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (!isPaused && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) setIsPaused(true);
    return () => clearInterval(interval);
  }, [isPaused, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `L10-Meeting-${activeDate}`,
  });

  return (
    <main id="pdf-content" className="flex flex-col min-h-screen max-w-7xl mx-auto p-4 md:p-8">
      <div className="visually-hidden"><PdfComponent ref={componentRef} data={data} /></div>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          html, body, #root, #pdf-content { 
            height: auto !important; 
            overflow: visible !important; 
            background-color: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          button, [data-html2canvas-ignore="true"], .nav-controls, .action-btn { 
            display: none !important; 
          }
          .slide {
            display: block !important; 
            width: 100% !important; 
            height: auto !important;
            min-height: 0 !important; 
            overflow: visible !important; 
            position: relative !important;
            page-break-after: always !important; 
            break-after: page !important; 
            padding: 0 !important; 
            margin: 0 !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            animation: none !important;
            transition: none !important;
          }
          table, tr, td, th, .bg-white, .rounded-xl, .card, li { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
          }
          * { box-shadow: none !important; }
          h1 { font-size: 24pt !important; }
          .subtitle { font-size: 14pt !important; }
        }
        .cloud-status.saving { color: var(--warning); }
        .cloud-status.saved { color: var(--success); }
        .cloud-status.error { color: var(--danger); }
      `}</style>

      {/* HEADER */}
      <header data-html2canvas-ignore="true" className="sticky top-0 z-40 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-4 border-b bg-white/90 backdrop-blur-md md:-mx-8 md:px-8 md:-mt-8 md:pt-8">
        <div className="text-center md:text-left">
          <h1 className="m-0 text-3xl font-bold text-slate-800 md:text-5xl">L10 MEETING</h1>
          <p className="m-0 text-lg font-semibold text-aksana-accent md:text-xl">MUTIF CORP</p>
        </div>
        <div className="flex items-center gap-4 border px-6 py-3 rounded-2xl border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-2xl font-mono font-bold text-aksana-accent">
            <i className="fa-regular fa-clock text-xl"></i>
            <span>{formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center gap-3 border-l pl-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:text-white bg-slate-100 transition-all hover:bg-aksana-primary"
            >
              <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
            </button>
            <button
              onClick={() => {
                setIsPaused(true);
                setTimeLeft(90 * 60);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full text-slate-600 bg-slate-100 transition-all hover:bg-slate-200"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        </div>
      </header>

      {/* --- SLIDE 0: TITLE PAGE --- */}
      <section className={`slide ${currentSlide === 0 ? 'active' : ''}`}>
        <div className="card flex flex-col justify-center items-center text-center border-none bg-transparent shadow-none">
          <div className="bg-white px-[60px] py-[40px] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-[#e2e8f0]">
            <div className="flex justify-center items-center gap-[10px] mb-[15px]">
              <div className="text-[14px] text-[var(--text-light)] uppercase tracking-[2px] font-bold">Tanggal Rapat</div>
              <button
                onClick={() => updateData('meetingDate', getCurrentDate())}
                className="bg-none border-none text-aksana-accent cursor-pointer text-[14px] p-[5px]"
                title="Set Otomatis ke Hari Ini"
              >
                <i className="fa-solid fa-arrows-rotate"></i>
              </button>
            </div>
            <div className="text-3xl font-extrabold text-aksana-primary md:text-5xl">{data.meetingDate}</div>
            
            {/* Tombol Muat Data Kemarin */}
            <button
              onClick={loadYesterdayData}
              className="mt-8 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-aksana-accent hover:text-white transition-all active:scale-95"
            >
              <i className="fa-solid fa-history mr-2"></i> Muat Data Kemarin
            </button>
          </div>
        </div>
      </section>

      {/* --- SLIDE 1: INITIAL SEGMENT --- */}
      <section className={`slide ${currentSlide === 1 ? 'active' : ''}`}>
        <div className="flex flex-col gap-1 mb-4">
          <h1>Segmen Awal</h1>
          <div className="subtitle">Kehadiran & Kabar Baik (5 Menit)</div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 h-auto">
          <div className="card h-auto">
            <h3>Daftar Hadir</h3>
            <div id="attendance-grid" className="flex flex-col gap-3 mt-4">
              {data.attendances.map((item) => (
                <div key={item.id} className="group flex items-center justify-between w-full p-3 border rounded-xl border-slate-100 bg-slate-50 transition-all hover:border-slate-200">
                  <div className="flex items-center flex-grow gap-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => handleUpdateAttendance(item.id, 'checked', e.target.checked)}
                      className="flex-shrink-0 w-5 h-5 cursor-pointer accent-aksana-primary"
                    />
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateAttendance(item.id, 'name', e.target.value)}
                      placeholder="Nama Divisi..."
                      className="w-full p-0 border-none text-sm font-medium text-slate-700 placeholder-slate-400 outline-none bg-transparent focus:ring-0"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteAttendance(item.id)}
                    className="action-btn flex-shrink-0 text-slate-300 hover:text-red-500 opacity-0 transition-all group-hover:opacity-100"
                    title="Hapus Baris"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddAttendance}
              className="flex items-center gap-1 mt-4 text-sm font-semibold text-aksana-accent hover:text-aksana-primary transition-colors"
            >
              <i className="fa-solid fa-plus"></i> Tambah Divisi / Peserta
            </button>
          </div>
          <div className="card">
            <h3>Good News (Kabar Syukur)</h3>
            <div className="flex flex-col gap-5 mt-5 text-lg">
              <div>
                <strong className="text-aksana-accent">Owner:</strong>
                <Editable className="input-box mt-[5px]" value={data.goodNews.owner} onChange={(val) => updateData('goodNews.owner', val)} />
              </div>
              <div>
                <strong className="text-aksana-accent">Integrator:</strong>
                <Editable className="input-box mt-[5px]" value={data.goodNews.integrator} onChange={(val) => updateData('goodNews.integrator', val)} />
              </div>
              <div>
                <strong className="text-aksana-accent">Perwakilan Tim:</strong>
                <Editable className="input-box mt-[5px]" value={data.goodNews.team} onChange={(val) => updateData('goodNews.team', val)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI SLIDES */}
      {[
        { title: 'Digital Marketing Supervisor', key: 'marketingKPI' },
        { title: 'Social Media Specialist', key: 'sosialKPI' },
        { title: 'Marketplace Specialist', key: 'mpsKPI' },
        { title: 'Meta Ads', key: 'metaKPI' },
        { title: 'KOL - Affiliate Specialist', key: 'kolKPI' },
        { title: 'Marketing Campaign', key: 'campaignKPI' },
      ].map((kpiCategory, index) => (
        <React.Fragment key={kpiCategory.key}>
          <section className={`slide ${currentSlide === (index + 2) ? 'active' : ''}`}>
            <div className="flex flex-col gap-1 mb-4">
              <h1 className="flex items-center gap-2">
                Scorecard:
                <Editable
                  value={data.scorecardTitles?.[kpiCategory.key] ?? kpiCategory.title}
                  onChange={(val) => updateData(`scorecardTitles.${kpiCategory.key}`, val)}
                  className="w-full m-0 p-0 leading-none text-3xl font-black text-aksana-primary md:text-5xl bg-transparent min-h-[1.2em]"
                />
              </h1>
              <div className="subtitle">Review KPI & Output</div>
            </div>
            <div className="card h-auto">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[600px] md:min-w-full">
                  <thead>
                    <tr>
                      <th className="w-[30%]">KPI</th>
                      <th className="w-[20%]">Target</th>
                      <th className="w-[20%]">Realisasi</th>
                      <th className="w-[12%] text-center">Jenis</th>
                      <th className="w-[12%] text-center">Status</th>
                      <th className="action-btn w-[6%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data[kpiCategory.key].map((item, i) => (
                      <tr key={i} className="group">
                        <td><Editable value={item.kpi} onChange={(val) => updateListItem(kpiCategory.key, i, 'kpi', val)} /></td>
                        <td><Editable value={item.target} onChange={(val) => updateListItem(kpiCategory.key, i, 'target', val)} /></td>
                        <td><Editable value={item.real} onChange={(val) => updateListItem(kpiCategory.key, i, 'real', val)} /></td>
                        <td align="center"><JenisButton jenis={item.jenis} onClick={() => updateListItem(kpiCategory.key, i, 'jenis', cycleJenis(item.jenis))} /></td>
                        <td align="center"><StatusButton status={item.status} onClick={() => updateListItem(kpiCategory.key, i, 'status', item.status === 'on' ? 'off' : 'on')} /></td>
                        <td align="center" className="action-btn">
                          <button
                            onClick={() => deleteListItem(kpiCategory.key, i)}
                            className="text-slate-300 hover:text-red-500 opacity-0 transition-all group-hover:opacity-100"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="add-btn mt-4" onClick={() => addRow(kpiCategory.key, { kpi: '', target: '', real: '', jenis: 'leading', status: 'on' })}>+ Tambah KPI</button>
            </div>
          </section>
        </React.Fragment>
      ))}

      {/* --- SLIDE 8: ROCK REVIEW --- */}
      <section className={`slide ${currentSlide === 8 ? 'active' : ''}`}>
        <div className="flex flex-col gap-1 mb-4">
          <h1>Rock Review</h1>
          <div className="subtitle">Prioritas 90 Hari</div>
        </div>
        <div className="card h-auto">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[600px] md:min-w-full">
              <thead>
                <tr>
                  <th className="w-[15%]">Owner</th>
                  <th className="w-[40%]">Rock</th>
                  <th align="center" className="w-[15%]">Status</th>
                  <th className="w-[25%]">Catatan</th>
                  <th className="action-btn w-[5%]"></th>
                </tr>
              </thead>
              <tbody>
                {data.rockReview.map((item, i) => (
                  <tr key={i} className="group">
                    <td><Editable value={item.owner} onChange={(val) => updateListItem('rockReview', i, 'owner', val)} placeholder="Input Owner..." /></td>
                    <td><Editable value={item.rock} onChange={(val) => updateListItem('rockReview', i, 'rock', val)} /></td>
                    <td align="center"><StatusButton status={item.status} onClick={() => updateListItem('rockReview', i, 'status', item.status === 'on' ? 'off' : 'on')} /></td>
                    <td><Editable value={item.note} onChange={(val) => updateListItem('rockReview', i, 'note', val)} /></td>
                    <td align="center" className="action-btn">
                      <button
                        onClick={() => deleteListItem('rockReview', i)}
                        className="text-slate-300 hover:text-red-500 opacity-0 transition-all group-hover:opacity-100"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="add-btn mt-4"
              onClick={() => addRow('rockReview', { owner: '', rock: '', status: 'on', note: '' })}
            >
              + Tambah Rock / Prioritas Baru
            </button>
          </div>
        </div>
      </section>

      {/* --- SLIDE 9: HEADLINES --- */}
      <section className={`slide ${currentSlide === 9 ? 'active' : ''}`}>
        <div className="flex flex-col gap-1 mb-4">
          <h1>Headlines</h1>
          <div className="subtitle">Berita Penting (Customer & Internal)</div>
        </div>
        <div className="flex flex-col gap-5 md:flex-row md:gap-6 h-auto pb-5">
          <div className="card headline-card flex-1 min-h-[300px] md:min-h-0">
            <h3 className="text-aksana-accent">Customer Headlines</h3>
            <div className="mt-4">
              {data.headlines.customer.map((hl, i) => (
                <div key={i} className="group flex items-start gap-4 mb-3">
                  <span className="mt-3 text-lg font-extrabold text-slate-400">{i + 1}.</span>
                  <Editable
                    className="input-box flex-grow"
                    value={hl}
                    onChange={(val) => {
                      const newHl = [...data.headlines.customer];
                      newHl[i] = val;
                      updateData('headlines', { ...data.headlines, customer: newHl });
                    }}
                  />
                  <button onClick={() => deleteHeadline('customer', i)} className="action-btn mt-3 text-slate-300 hover:text-red-500 opacity-0 transition-all group-hover:opacity-100">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-btn"
              onClick={() => {
                const newHl = [...data.headlines.customer, ''];
                updateData('headlines', { ...data.headlines, customer: newHl });
              }}
            >
              + Tambah Customer Headline
            </button>
          </div>
          <div className="card headline-card flex-1 min-h-[300px] md:min-h-0">
            <h3 className="text-aksana-success">Internal Headlines</h3>
            <div className="mt-4">
              {data.headlines.internal.map((hl, i) => (
                <div key={i} className="group flex items-start gap-4 mb-3">
                  <span className="mt-3 text-lg font-extrabold text-slate-400">{i + 1}.</span>
                  <Editable
                    className="input-box flex-grow"
                    value={hl}
                    onChange={(val) => {
                      const newHl = [...data.headlines.internal];
                      newHl[i] = val;
                      updateData('headlines', { ...data.headlines, internal: newHl });
                    }}
                  />
                  <button onClick={() => deleteHeadline('internal', i)} className="action-btn mt-3 text-slate-300 hover:text-red-500 opacity-0 transition-all group-hover:opacity-100">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-btn"
              onClick={() => {
                const newHl = [...data.headlines.internal, ''];
                updateData('headlines', { ...data.headlines, internal: newHl });
              }}
            >
              + Tambah Internal Headline
            </button>
          </div>
        </div>
      </section>

      {/* --- SLIDE 10: TO-DO LIST --- */}
      <section className={`slide ${currentSlide === 10 ? 'active' : ''}`}>
        <div className="flex flex-col gap-1 mb-4">
          <h1>To-Do List</h1>
          <div className="subtitle">Review minggu lalu & Action Plan</div>
        </div>
        <div className="card h-auto">
          <ol className="todo-list">
            {data.todoList.map((item, i) => (
              <li key={i} className="todo-item group flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <span className="todo-number">{i + 1}.</span>
                <div className="todo-text-wrapper flex-grow w-full">
                  <Editable className="input-box" value={item.text} onChange={(val) => updateListItem('todoList', i, 'text', val)} />
                  <div className="flex items-center mt-2">
                    <span className="owner-label mr-2 text-sm font-semibold">Owner:</span>
                    <Editable className="owner-input" value={item.owner} onChange={(val) => updateListItem('todoList', i, 'owner', val)} />
                  </div>
                </div>
                <div className="todo-action flex flex-shrink-0 items-center gap-3 self-end sm:self-center">
                  <OutcomeButton outcome={item.outcome} onClick={() => updateListItem('todoList', i, 'outcome', item.outcome === 'done' ? 'not' : 'done')} />
                  <button onClick={() => deleteListItem('todoList', i)} className="action-btn text-slate-300 hover:text-red-500 opacity-0 transition-all group-hover:opacity-100">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button className="add-btn mt-4" onClick={() => addRow('todoList', { text: '', owner: '', outcome: 'not' })}>+ Add To-Do</button>
        </div>
      </section>

      {/* --- SLIDE 11: IDS SESSION --- */}
      <section className={`slide ${currentSlide === 11 ? 'active' : ''}`}>
        <div className="flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center mb-2">
          <div className="flex flex-col gap-1">
            <h1>IDS Session</h1>
            <div className="subtitle">Identify, Discuss, Solve (60 Menit)</div>
          </div>
          <button
            onClick={populateIDS}
            className="sm:w-auto w-full py-2 px-4 border-none rounded-md text-sm font-semibold text-white bg-red-600 cursor-pointer transition-colors hover:bg-red-700"
          >
            <i className="fa-solid fa-sync"></i> Tarik Data Off-Track
          </button>
        </div>
        <div className="ids-container flex flex-col gap-5 md:flex-row h-auto mt-4">
          <div className="ids-col card flex flex-1 flex-col min-h-[300px]">
            <h3 className="mb-4">1. Identify (Issues List)</h3>
            <div id="ids-identify-list" className="flex flex-col gap-3 pr-1">
              {data.ids.issues.map((issue, i) => (
                <div key={i} className="ids-item group flex gap-3 items-start p-3 rounded-lg bg-slate-50">
                  <input
                    type="checkbox"
                    checked={issue.checked}
                    onChange={(e) => {
                      const newIssues = [...data.ids.issues];
                      newIssues[i].checked = e.target.checked;
                      newIssues.sort((a, b) => Number(b.checked) - Number(a.checked));
                      updateData('ids', { ...data.ids, issues: newIssues });
                    }}
                    className="flex-shrink-0 mt-1"
                  />
                  <Editable
                    className="ids-text flex-grow"
                    value={issue.text}
                    onChange={(val) => {
                      const newIssues = [...data.ids.issues];
                      newIssues[i].text = val;
                      updateData('ids', { ...data.ids, issues: newIssues });
                    }}
                  />
                  {issue.source && (
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      issue.source === 'Scorecard' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
                    }`}>
                      {issue.source}
                    </span>
                  )}
                  <button onClick={() => deleteIssue(i)} className="action-btn text-slate-300 hover:text-red-500 opacity-0 transition-all group-hover:opacity-100 mt-1">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addIssue}
              className="w-full p-3 mt-4 border-none rounded-lg text-sm font-semibold text-slate-500 bg-slate-100 cursor-pointer transition-colors hover:bg-slate-200"
            >
              + Manual Issue
            </button>
          </div>
          <div className="ids-col card flex flex-1 flex-col min-h-[300px]">
            <h3 className="mb-4">2. Discuss (Notes)</h3>
            <div className="w-full">
              <Editable className="ids-notes w-full min-h-[200px]" value={data.ids.notes} onChange={(val) => updateData('ids.notes', val)} />
            </div>
          </div>
          <div className="ids-col card flex flex-1 flex-col min-h-[300px]">
            <h3 className="mb-4">3. Solve (Action Items)</h3>
            <div className="w-full">
              <Editable className="ids-solutions w-full min-h-[200px]" value={data.ids.solutions} onChange={(val) => updateData('ids.solutions', val)} />
            </div>
          </div>
        </div>
      </section>

      {/* --- SLIDE 12: CONCLUDING SEGMENT --- */}
      <section className={`slide ${currentSlide === 12 ? 'active' : ''}`}>
        <div className="flex flex-col gap-1 mb-4">
          <h1>Segmen Akhir</h1>
          <div className="subtitle">Rating Rapat & Penutup (5 Menit)</div>
        </div>
        <div className="card h-auto">
          <h3>Beri Rating Rapat (1-10)</h3>
          <div className="grid grid-cols-2 gap-4 my-8 md:grid-cols-3 lg:grid-cols-5">
            {data.attendances.filter(a => a.checked).map((attendee) => {
              const roleKey = 'rating_id_' + attendee.id;
              return (
                <div key={attendee.id} className="flex flex-col items-center p-4 border rounded-xl border-slate-100 bg-white shadow-sm transition-all hover:border-aksana-primary">
                  <label className="mb-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {attendee.name || "Isi Nama..."}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-16 h-12 border-2 rounded-lg text-center text-2xl font-bold text-aksana-primary border-slate-200 outline-none transition-all focus:border-aksana-accent focus:ring-4 focus:ring-blue-50"
                    value={data.ratings[roleKey] ?? ''}
                    onChange={(e) => {
                      updateData('ratings', { ...data.ratings, [roleKey]: e.target.value });
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center mt-8 pt-8 border-t border-slate-100">
            <div className="mb-2 text-sm font-bold text-slate-400 uppercase tracking-[3px]">Rata-Rata Rating</div>
            <div className="leading-none text-7xl font-black text-aksana-primary md:text-9xl">
              {averageRating}
            </div>
          </div>
          <p className="text-center text-[var(--text-light)] mt-[30px] text-[18px] italic">
            "Rapat yang hebat dimulai dari kedisiplinan dan diakhiri dengan komitmen."
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer data-html2canvas-ignore="true" className="sticky bottom-0 z-40 flex flex-col md:flex-row items-center justify-between gap-6 mt-auto pt-4 border-t md:-mx-8 md:px-8 md:-mb-8 md:pb-8 border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="flex justify-center md:justify-start w-full md:w-auto">
            <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-slate-800 transition-all shadow-md active:scale-95 hover:bg-slate-700"
            onClick={handlePrint}
          >
            <i className="fa-solid fa-file-pdf"></i> High Quality PDF Report
          </button>
        </div>
        <div className={`flex items-center justify-center gap-3 px-6 py-2 rounded-full border text-sm font-bold shadow-sm transition-all duration-300 ${
          cloudStatus === 'saving' 
            ? 'bg-blue-50 border-blue-200 text-blue-600 animate-pulse scale-105' 
            : cloudStatus === 'error' 
              ? 'bg-red-50 border-red-100 text-red-500' 
              : 'bg-white border-slate-100 text-aksana-primary'
        }`}>
          <i className={`fa-solid ${cloudStatus === 'saving' ? 'fa-spinner fa-spin' : 'fa-cloud'}`}></i>
          <span>{cloudMsg}</span>
        </div>
        <div className="flex justify-center md:justify-end w-full md:w-auto gap-4">
          <button
            className="flex items-center justify-center w-14 h-14 rounded-full text-white bg-aksana-primary shadow-lg transition-all active:scale-90 hover:bg-aksana-primary/80"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
          >
            <i className="fa-solid fa-chevron-left text-xl"></i>
          </button>
          <div className="flex items-center justify-center px-4 border rounded-xl font-bold text-slate-400 bg-slate-50">
            {currentSlide + 1} / 13
          </div>
          <button
            className="flex items-center justify-center w-14 h-14 rounded-full text-white bg-aksana-primary shadow-lg transition-all active:scale-90 hover:bg-aksana-primary/80"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
          >
            <i className="fa-solid fa-chevron-right text-xl"></i>
          </button>
        </div>
      </footer>
    </main>
  );
}

export default App;
