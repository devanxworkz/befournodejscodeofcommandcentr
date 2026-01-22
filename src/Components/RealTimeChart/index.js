              import React, { useEffect, useMemo, useState,useRef,inputRef } from "react";
              import { Calendar } from "lucide-react";
              import { CreditCard, User, Phone } from "lucide-react";
              import { Search } from "lucide-react"; 
              import { Zap, Power, BatteryCharging, Battery,MapPin } from "lucide-react";
              import Chart from "react-apexcharts";
              import { useNavigate } from "react-router-dom";
              import { Textfit } from "react-textfit";
              import { Home, BarChart2, Table,Map, Ticket, Command, Menu, Bike, Car, X,ChevronLeft} from "lucide-react"; 
              import L from "leaflet";
              import { useMap } from "react-leaflet";
              import { Bookmark } from "lucide-react"; // Icon pack
              import { Bell } from "lucide-react";

              // import Cookies from "js-cookie";

              import {TileLayer, Polyline, Marker, Popup } from "react-leaflet";
              import "leaflet/dist/leaflet.css";

              import {
                ResponsiveContainer,
                CartesianGrid,
                XAxis,
                YAxis,
                Tooltip,
                Legend,
                LineChart,
                Line,
                ReferenceLine,
              } from "recharts";
              // keep your existing gauges

              import SpeedGauge from "../SpeedGauge";
              import SpeedGaugesoc from "../Speedgaugesoc";
              import OnlyForSpeed from "../OnlyForSpeed";
              import ThreeQuarterGauge from "../ThreeQuarterGauge";
              import OnlyForsoc from '../OnlyForsoc'
              import "./index.css"
              import ThermometerCard from '../ThermometerCard'
              import CustomAlert  from "../CustomAlert";
              import Sidebar from "../Sidebar";
              import Wapelement from '../Wapelement';
              import LiveTracker from '../LiveTracker';
              import Worlelc from "../Worlelc";
              import FloatingBookmark from '../FloatingBookmark'
              import Tabledata from '../Tabledata'
              // import LiveAlerts from '../LiveAlerts'
              import TicketUi from '../TicketUi'
              import TelemetryDashboardCell from '../TelemetryDashboardCell';
              import SendCommand  from '../SendCommand';

              const fmt = {
                num(x, d = 2) {
                  if (x === undefined || x === null || isNaN(Number(x))) return "N/A";
                  const n = Number(x);
                  return Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(d);
                },
                parseDate(t) {
                  if (!t) return null;
                  const d = new Date(t);
                  return isNaN(d) ? null : d;
                },
                when(t) {
                  const d = fmt.parseDate(t);
                  return d ? `${d.toLocaleDateString()} ${d.toLocaleTimeString()}` : "";
                },
            };

              const SectionTitle = ({ left, right }) => (
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-sm sm:text-base font-Kanit text-White">
                    {left}
                  </h3>
                  {right}
                </div>
              );

          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
          });

          const StatChip = ({ label, value }) => (
            <div
              className="rounded-xl p-3 flex flex-col gap-1
                        bg-gradient-to-br from-black/60 via-neutral-950 to-neutral-900
                        border border-white/10 shadow-md
                        hover:border-orange-500/60 hover:shadow-orange-500/20 transition
                        transition-all duration-300"
            >
              {/* Label */}
              <span className="text-[12px] sm:text-[13px] font-medium tracking-wide text-gray-400">
                {label}
              </span>

              {/* Value */}
              <span className="text-sm sm:text-base font-Kanit font-Kanit text-orange-300 truncate">
                {value}
              </span>
            </div>
          );

          const StatCard = ({ label, value, icon: Icon, valueClassName }) => {
            return (
              <div
                className="flex flex-col justify-between 
                          bg-gradient-to-br from-neutral-800 to-black                  
                          text-white rounded-2xl p-4 
                          border border-white/10 shadow-md
                          hover:shadow-orange-500/20 transition
                          hover:border-orange-500 
                          transition-all duration-300"
              >
                {/* Label */}
                {label && (
                  <span className="text-sm sm:text-[14px] text-gray-400 mb-2 tracking-wide">
                    {label}
                  </span>
                )}

                {/* Value + Icon */}
                <div className="flex items-start gap-3 text-sm sm:text-base font-Kanit">
                  {Icon && (
                    <div className="relative flex items-center justify-center">
                      <Icon
                        className="w-8 h-8 rounded-xl p-1.5
                                  bg-gradient-to-br from-orange-600/30 to-orange-400/20 
                                  border border-orange-500/20 
                                  shadow-[0_0_15px_rgba(255,140,66,0.4)] 
                                  text-orange-400"
                      />
                      {/* subtle glossy overlay */}
                      <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent opacity-40 pointer-events-none" />
                    </div>
                  )}
                  <span
                    className={`block leading-snug ${valueClassName || "whitespace-normal break-words w-full"}`}
                    title={typeof value === "string" ? value : undefined}
                  >
                    {value}
                  </span>
                </div>
              </div>
            );
          };
          async function getReadableLocation(lat_long) {
            if (!lat_long) return "N/A";

            let lat, lng;

            if (typeof lat_long === "object") {
              if (Array.isArray(lat_long)) {
                [lat, lng] = lat_long;
              } else {
                lat = lat_long.lat ?? lat_long.latitude;
                lng = lat_long.lng ?? lat_long.lon ?? lat_long.longitude;
              }
            } else if (typeof lat_long === "string" && lat_long.includes(",")) {
              [lat, lng] = lat_long.split(",").map((n) => parseFloat(n.trim()));
            }

            lat = parseFloat(lat);
            lng = parseFloat(lng);
            if (isNaN(lat) || isNaN(lng)) return "N/A";

            // ✅ LocalStorage cache
            const cacheKey = `loc:${lat.toFixed(5)},${lng.toFixed(5)}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) return cached;

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                {
                  headers: {
                    "User-Agent": "YourAppName/1.0 (your@email.com)", // required by Nominatim
                    "Accept-Language": "en", // optional, force English
                  },
                }
              );
              const data = await res.json();
              const result = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

              localStorage.setItem(cacheKey, result); // save for next time
              return result;
            } catch {
              return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            }
          }

      // tire pressure
      // utils/tirePressure.js
      

export function parseTirePressure(rawValue) {
  if (!rawValue || typeof rawValue !== "string") return null;

  // Match independently (order does NOT matter)
  const frontMatch = rawValue.match(/F(\d{2})(\d{2})/i);
  const rearMatch  = rawValue.match(/R(\d{2})(\d{2})/i);

  const parsed = {
    front: null,
    rear: null
  };

  if (frontMatch) {
    const [, pressure, temp] = frontMatch;
    parsed.front = {
      pressure: Number(pressure),
      temp: Number(temp),
    };
  }

  if (rearMatch) {
    const [, pressure, temp] = rearMatch;
    parsed.rear = {
      pressure: Number(pressure),
      temp: Number(temp),
    };
  }

  // If neither tire exists → null
  if (!parsed.front && !parsed.rear) return null;

  return parsed;
}



      const CARD_BASE_TRANSPARENTs =
        "rounded-2xl border-2 border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),#0A0A23)] p-4 transition-colors duration-300 hover:border-[#3B82F6]";

      const CARD_BASE_TRANSPARENT =
        "rounded-2xl border-2 border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),#0A0A23)] p-4 transition-colors duration-300 hover:border-[#3B82F6]";

      const CARD_BASE = 
        "rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),#0A0A23)] p-4 transition-colors duration-300 hover:border-[#3B82F6]";

      const CARD_BASE_GLOW  =
        "rounded-2xl border border-[#3B82F6]/40 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),#0A0A23)] p-4 shadow-[0_0_18px_rgba(59,130,246,0.35)] hover:border-[#3B82F6] hover:shadow-[0_0_28px_rgba(59,130,246,0.65)] transition-colors duration-300";

      const CARD_BASE_FLAT =
        "rounded-2xl border border-white/20 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),#0A0A23)] p-4 transition-colors duration-300 hover:border-[#3B82F6]";

      const CARD_MIN_H = "min-h-[220px]"; // same height across the grid

      const CARD_CLICK_OVERLAY =
        "absolute inset-0 rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6]";

              // Wrap any content so the WHOLE card opens a modal when clicked
              function Svg({ title, children, minH = CARD_MIN_H, maxW = "max-w-5xl", glow = false }) {
                const [open, setOpen] = useState(false);
                return (
                  <>
                    <div
                      className={`relative ${glow ? CARD_BASE_GLOW : CARD_BASE_FLAT} ${minH} 
                                  transition-colors duration-300 hover:border-[#FF9913]`}
                    >
                      {/* Invisible overlay for click-to-expand */}
                      <button
                        type="button"
                        className={CARD_CLICK_OVERLAY}
                        aria-label={`Expand ${title || "card"}`}
                        onClick={() => setOpen(true)}
                      />
                      <div className="relative z-10">{children}</div>
                    </div>
                  </>
                );
              }

              // Optional: center map on live marker
        function AutoCenter({ position }) {
        const map = useMap();
        useEffect(() => {
          if (position) map.setView(position, 15);
        }, [position, map]);
        return null;
      }

      // cachekey for privent the 500+ nomintim requist 
      function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

              export default function RealTimeChart({ vin: initialVin }) {
                const [vin, setVin] = useState(initialVin || "");
                const [vinList, setVinList] = useState([]);
                const [data, setData] = useState([]);
                const [mode, setMode] = useState("realtime");
                const [details, setDetails] = useState([]);
                const [showInAHChart, setShowInAHChart] = useState(false);
                const [latestGauges, setLatestGauges] = useState(null);
                const [livedata, setLiveData] = useState([]); // ✅ start as empty array
                const [historyData, setHistoryData] = useState([]);
                const [showHistoryChart, setShowHistoryChart] = useState(false);
                const [ntcData, setNtcData] = useState(null);
                const [searchValue, setSearchValue] = useState("");
                const [suggestions, setSuggestions] = useState([]);
                const [showSuggestions, setShowSuggestions] = useState(false);
                const [highlightIndex, setHighlightIndex] = useState(-1);
                const [isSelecting, setIsSelecting] = useState(false);
                const [loading, setLoading] = useState(false);
              const [selectedVin, setSelectedVin] = useState(null);
              const [showMetrics1, setShowMetrics1] = useState(false);
              const [isSelected, setIsSelected] = useState(false); // ✅ new flag
              const [startDateTime, setStartDateTime] = useState(getCurrentDateTimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
              const [endDateTime, setEndDateTime] = useState(getCurrentDateTimeLocal(new Date()));
              const [alertMessage, setAlertMessage] = useState("");
              const [userChanged, setUserChanged] = useState(false);
              const [locationName, setLocationName] = useState("Loading...");
              const [autoMode, setAutoMode] = useState(true); // ✅ controls auto-update
            const intervalRef = useRef(null);
            const [isOpen, setIsOpen] = useState(true);
            const toggleSidebar = () => setIsOpen(!isOpen);
            const [isScrolled, setIsScrolled] = useState(false);
            const inputRef = useRef(null);    
            const [locationMap, setLocationMap] = React.useState({});
            const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
            const [tick, setTick] = React.useState(0);
            const latestt = livedata?.[livedata.length - 1];
            // console.log(latestt);
            const data1 = parseTirePressure(latestt?.tirepressure);
            // console.log(data1)
            const [history, setHistory] = useState([]);
            const [positions, setPositions] = useState([]); // history
            const [latestPos, setLatestPos] = useState(null); // live position
            const [startTime, setStartTime] = useState("");
            const [endTime, setEndTime] = useState("");
            const [fetchParams, setFetchParams] = useState(null);
            const [activeTab, setActiveTab] = useState("history");
            const [loading1, setLoading1] = useState(false);
            const [autoMode1, setAutoMode1] = useState(true); // auto update times if true
            const [isOpens, setIsOpens] = useState(true);
            const [alerts, setAlerts] = useState([]);
            const [showAlertBox, setShowAlertBox] = useState(false);
            const prevFlags = useRef([]);
            const prevNTCs = useRef([]);
            const prevVoltage = useRef(null);

            const [lastUpdated, setLastUpdated] = useState("");
            const mucu_verstion = latestt?.data;
            // console.log(mucu_verstion);
            const mcuVersion =
              mucu_verstion
                ?.split(",")
                ?.find(item => item.startsWith("mcuV="))
                ?.split("=")[1];
              const mapsFlag =
              mucu_verstion
                ?.split(",")
                ?.find(item => item.startsWith("maps="))
                ?.split("=")[1];
                const mapsaosp =
                 mucu_verstion
                ?.split(",")
                ?.find(item => item.startsWith("AOSPv="))
                ?.split("=")[1];

              // console.log(mucu_verstion);




            useEffect(() => {
              if (!details?.time) return;

              const d = new Date(details.time);
              if (isNaN(d)) return;

              setLastUpdated(d.toLocaleString());
            }, [details?.time]);



            let locationData = null;

if (details?.lat_long) {
  const [lat, lng] = details.lat_long
    .split(",")
    .map((n) => parseFloat(n.trim()));

  if (!isNaN(lat) && !isNaN(lng)) {
    const rawTime = details?.time;
    let formattedTime = "N/A";

    if (rawTime) {
      const d = new Date(rawTime);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        formattedTime = `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
      }
    }

    locationData = {
      lat,
      lng,
      locationName,
      formattedTime,
      mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
    };
  }
}


  // ✅ MOSFET alert logic
  // useEffect(() => {
  //   if (!details?.bmsmosstates) return;

  //   const flags = details.bmsmosstates
  //     .split(",")
  //     .map((v) => parseInt(v.trim(), 10));

  //   const [mainCharge, mainDischarge] = [flags[0], flags[1]];
  //   if (JSON.stringify(flags) === JSON.stringify(prevFlags.current)) return;
  //   prevFlags.current = flags;

  //   const latLong = details.lat_long || "";
  //   const [lat, lon] = latLong.split(",").map((v) => v?.trim() || "N/A");
  //   const time = new Date().toLocaleTimeString();

  //   const newAlerts = [];

  //   if (!mainCharge) {
  //     newAlerts.push({
  //       id: Date.now(),
  //       message: `⚠️ Main Charge MOSFET OFF at ${time} (Lat: ${lat}, Lon: ${lon})`,
  //     });
  //   }

  //   if (!mainDischarge) {
  //     newAlerts.push({
  //       id: Date.now() + 1,
  //       message: `⚠️ Main Discharge MOSFET OFF at ${time} (Lat: ${lat}, Lon: ${lon})`,
  //     });
  //   }

  //   if (newAlerts.length > 0) setAlerts((prev) => [...prev, ...newAlerts]);
  // }, [details?.bmsmosstates]);

  // ✅ NTC temperature alert logic
  // useEffect(() => {
  //   if (!ntcData?.ntc) return;

  //   const latLong = details.lat_long || "";
  //   const [lat, lon] = latLong.split(",").map((v) => v?.trim() || "N/A");
  //   const time = new Date().toLocaleTimeString();

  //   const match = ntcData.ntc.match(/ntc=([^ ]+)/i);
  //   const raw = match && match[1] ? match[1] : "";
  //   const arr = raw.split(",").map((v) => Number(v.trim()));

  //   if (JSON.stringify(arr) === JSON.stringify(prevNTCs.current)) return;
  //   prevNTCs.current = arr;

  //   const newAlerts = [];

  //   arr.forEach((val, i) => {
  //     if (val > 50) {
  //       newAlerts.push({
  //         id: Date.now() + i,
  //         message: `🔥 NTC${i + 1} temperature high (${val}°C) at ${time} (Lat: ${lat}, Lon: ${lon})`,
  //       });
  //     }
  //   });

  //   if (newAlerts.length > 0) setAlerts((prev) => [...prev, ...newAlerts]);
  // }, [ntcData?.ntc]);

  // ✅ Battery voltage alert logic
  // useEffect(() => {
  //   if (!latestGauges?.batvoltage) return;
  //   const voltage = Number(latestGauges.batvoltage);
  //   if (voltage === prevVoltage.current) return;
  //   prevVoltage.current = voltage;

  //   if (voltage < 65) {
  //     const latLong = details.lat_long || "";
  //     const [lat, lon] = latLong.split(",").map((v) => v?.trim() || "N/A");
  //     const time = new Date().toLocaleTimeString();

  //     setAlerts((prev) => [
  //       ...prev,
  //       {
  //         id: Date.now(),
  //         message: `🔋 Low Battery Voltage (${voltage.toFixed(
  //           1
  //         )} V) at ${time} (Lat: ${lat}, Lon: ${lon})`,
  //       },
  //     ]);
  //   }
  // }, [latestGauges?.batvoltage]);


  let minCellNumber = null;
  let maxCellNumber = null;

if (latestGauges?.ntc && latestGauges.ntc.includes("ICV=")) {
  const match = latestGauges.ntc.match(/ICV=(\w+)/);

  if (match) {
    const icv = match[1];

    maxCellNumber = parseInt(icv.slice(4, 6), 16);
    minCellNumber = parseInt(icv.slice(10, 12), 16);
  }
}
 
  // Example: Add alert (you can call this when BMS MOS goes OFF)
  const addAlert = (message) => {
    const newAlert = { id: Date.now(), message, time: new Date().toLocaleString() };
    setAlerts((prev) => [newAlert, ...prev]);
  };

            //  const navigate = useNavigate();

  // useEffect(() => {
    // const isLoggedIn = Cookies.get("isLoggedIn");
    // if (!isLoggedIn) {
      // navigate("/"); 
    // }
  // }, [navigate]);

  // const handleLogout = () => {
    // Cookies.remove("isLoggedIn");
    // navigate("/");
  // };

    const [isOpensf, setIsOpensf] = useState(false);
  const bookmarkRef = useRef(null);

  // 🧠 Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bookmarkRef.current && !bookmarkRef.current.contains(event.target)) {
        setIsOpens(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

      const navigate = useNavigate();

        const handleLogout = () => {
          localStorage.removeItem("isLoggedIn");
          navigate("/");
        };

        // format date to yyyy-MM-ddTHH:mm
        const formatDateTimeLocal = (date) => date.toISOString().slice(0, 16);

        // Set default time (last 24h)
        const setDefaultTimes = () => {
          const now = new Date();
          const past24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          setStartTime(formatDateTimeLocal(past24));
          setEndTime(formatDateTimeLocal(now));
          setAutoMode1(true);
        };

        // Auto-update times every minute if autoMode is true
        useEffect(() => {
          const timer = setInterval(() => {
            if (autoMode) setDefaultTimes();
          }, 60000);
          return () => clearInterval(timer);
        }, [autoMode]);

        // Initialize default times on mount
        useEffect(() => {
          setDefaultTimes();
        }, []);

        // Handle start/end time change by user → stop auto update
        const handleStartChange1 = (value) => {
          setStartTime(value);
          setAutoMode1(false);
        };
        const handleEndChange1 = (value) => {
          setEndTime(value);
          setAutoMode1(false);
        };

        // Example fetch function — replace with your actual fetch
        const fetchData = async ({ start, end }) => {
          setLoading1(true);
          try {
            console.log("Fetching data for:", start, end);
            // Example: await fetch(`/api/data?start=${start}&end=${end}`);
            // Simulate delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setFetchParams({ start, end });
            setActiveTab("history");
          } catch (err) {
            console.error(err);
          } finally {
            setLoading1(false);
          }
        };

        // Handle "Load History" button
        const handleLoadHistory = () => {
          if (!startTime || !endTime) return;
          fetchData({ start: startTime, end: endTime });
        };

        // ✅ Fetch data from your API
        

        const getStatusColor = (status) => {
          switch (status) {
            case "CRITICAL":
              return "text-red-500";
            case "HIGH":
              return "text-red-400";
            case "IDEAL":
              return "text-yellow-400";
            default:
              return "text-gray-400";
          }
        };     
        
          
          useEffect(() => {
            const interval = setInterval(() => {
              setTick((prev) => prev + 1); // 🔄 refresh every second
            }, 3000);
            return () => clearInterval(interval);
          }, []);

      const [activePage, setActivePage] = React.useState("home"); 

        const [isCollapsed, setIsCollapsed] = React.useState(true);


      // copy in graph of lat_long
      const [hoveredLatLong, setHoveredLatLong] = React.useState(null);

      React.useEffect(() => {
        const handleCopy = (e) => {
          if (e.ctrlKey && e.key === "c" && hoveredLatLong) {
            e.preventDefault(); // stop default copy
            navigator.clipboard.writeText(hoveredLatLong);
          }
        };

        window.addEventListener("keydown", handleCopy);
        return () => window.removeEventListener("keydown", handleCopy);
      }, [hoveredLatLong]);


        // Example in your component
      const mainRef = useRef(null);

      useEffect(() => {
        const mainEl = mainRef.current;
        if (!mainEl) return;

        const handleScroll = () => {
          setIsScrolled(mainEl.scrollTop > 10); // ✅ now checks main scroll
        };

        mainEl.addEventListener("scroll", handleScroll);
        return () => mainEl.removeEventListener("scroll", handleScroll);
      }, []);


      const [apiUrl, setApiUrl] = useState("");

      useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }, []);



      const [coords, setCoords] = useState({ lat: null, lng: null });

        const rawLatLong = latestGauges?.lat_long || details?.lat_long || "";
            
          useEffect(() => {
        if (!rawLatLong) return;

        const [lat, lng] = rawLatLong.split(",").map((n) => parseFloat(n.trim()));

        if (isNaN(lat) || isNaN(lng)) {
          // console.error("Invalid lat/lng:", rawLatLong);
          setLocationName("Invalid location");
          return;
        }

        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          {
            headers: {
              "User-Agent": "YourAppName/1.0 (your@email.com)", // required by Nominatim
              "Accept-Language": "en", // optional, force English response
            },
          }
        )
          .then((res) => res.json())
          .then((data) => {
            setLocationName(data.display_name || `${lat}, ${lng}`);
          })
          .catch(() => {
            setLocationName(`${lat}, ${lng}`);
          });
      }, [rawLatLong, latestGauges?.lat_long, details?.lat_long]);
      // 👈 track changes

              // Graph States
              const [livedatafor, setLivedatafor] = useState([]);
              const [metricsSelected, setMetricsSelected] = useState(["speed_kmph", "currentPositive", "currentNegative" ]);
              const [metricsSelected1, setMetricsSelected1] = useState(["speed_kmph","currentPositive", "currentNegative"]);
              const [showMetrics, setShowMetrics] = useState(false); // mobile dropdown toggle

                      const cellMetricOptions = Array.from({ length: 23 }, (_, i) => ({
          key: `cell${i + 1}`,
          label: `Cell ${i + 1} voltage (V)`,
          color: "#22c55e"
        }));


   // 🔹 Base metrics
const metricOptions = [
  { key: "currentPositive", label: "Current generation (A)", color: "#13ff23" },
  { key: "currentNegative", label: "Current consumption (A)", color: "#ff0000" },
  { key: "speed_kmph", label: "Speed (km/h)", color: "#05a2ebff" },
  { key: "motortemp", label: "Motor temp (°C)", color: "#f9c805ff" },
  { key: "controllermostemp", label: "Controller temp (°C)", color: "#fc5507ff" },
  { key: "soc", label: "SOC (%)", color: "#ffffff" },
  { key: "inah", label: "Inah (Ah)", color: "#f6098fff" },
  { key: "outah", label: "Outah (Ah)", color: "#78c004ff" },
  { key: "batvoltage", label: "Battery voltage (V)", color: "#fef18aff" },

  // 🔹 NTC temperatures
  { key: "ntc1", label: "Positive terminal temp (°C)", color: "#a8f8ffff" },
  { key: "ntc2", label: "Cell no 20 temp (°C)", color: "#ee71fcff" },
  { key: "ntc3", label: "Cell no 50 temp (°C)", color: "#9b97f4ff" },
  { key: "ntc4", label: "Negative terminal temp (°C)", color: "#46f6bbff" },
  { key: "mos1", label: "Main charge mosfet", color: "#f97316" },
  { key: "mos2", label: "Main discharge mosfet", color: "#14b8a6" },
  { key: "mos3", label: "APU charge mosfet", color: "#8b5cf6" },
  { key: "mos4", label: "APU discharge mosfet", color: "#e11d48" }, 
  { key: "mainMinVoltage", label: "Main min cell voltage (V)", color: "#60a5fa" },
  { key: "mainMaxVoltage", label: "Main max cell voltage (V)", color: "#2563eb" },
  { key: "mainMinCell", label: "Main min cell no", color: "#a1a1aa" },
  { key: "mainMaxCell", label: "Main max cell no", color: "#eab308" },

  // 🔹 23 Cell voltages
  { key: "cell1", label: "Cell 1 voltage (V)", color: "#22c55e" },
  { key: "cell2", label: "Cell 2 voltage (V)", color: "#22c55e" },
  { key: "cell3", label: "Cell 3 voltage (V)", color: "#22c55e" },
  { key: "cell4", label: "Cell 4 voltage (V)", color: "#22c55e" },
  { key: "cell5", label: "Cell 5 voltage (V)", color: "#22c55e" },
  { key: "cell6", label: "Cell 6 voltage (V)", color: "#22c55e" },
  { key: "cell7", label: "Cell 7 voltage (V)", color: "#22c55e" },
  { key: "cell8", label: "Cell 8 voltage (V)", color: "#22c55e" },
  { key: "cell9", label: "Cell 9 voltage (V)", color: "#22c55e" },
  { key: "cell10", label: "Cell 10 voltage (V)", color: "#22c55e" },
  { key: "cell11", label: "Cell 11 voltage (V)", color: "#22c55e" },
  { key: "cell12", label: "Cell 12 voltage (V)", color: "#22c55e" },
  { key: "cell13", label: "Cell 13 voltage (V)", color: "#22c55e" },
  { key: "cell14", label: "Cell 14 voltage (V)", color: "#22c55e" },
  { key: "cell15", label: "Cell 15 voltage (V)", color: "#22c55e" },
  { key: "cell16", label: "Cell 16 voltage (V)", color: "#22c55e" },
  { key: "cell17", label: "Cell 17 voltage (V)", color: "#22c55e" },
  { key: "cell18", label: "Cell 18 voltage (V)", color: "#22c55e" },
  { key: "cell19", label: "Cell 19 voltage (V)", color: "#22c55e" },
  { key: "cell20", label: "Cell 20 voltage (V)", color: "#22c55e" },
  { key: "cell21", label: "Cell 21 voltage (V)", color: "#22c55e" },
  { key: "cell22", label: "Cell 22 voltage (V)", color: "#22c55e" },
  { key: "cell23", label: "Cell 23 voltage (V)", color: "#22c55e" }
];

      const metricOptions1 = [
        { key: "currentPositive", label: "Current generation (A)", color: "#13ff23" },
        { key: "currentNegative", label: "Current consumption (A)", color: "#ff0000" },
        { key: "speed_kmph", label: "Speed (km/h)", color: "#05a2ebff" },
        { key: "motortemp", label: "Motor temp (°C)", color: "#f9c805ff" },
        { key: "controllermostemp", label: "Controller temp (°C)", color: "#fc5507ff" },
        { key: "soc", label: "SOC (%)", color: "#ffff" },
        { key: "inah", label: "Inah (Ah)", color: "#f6098fff" },
        { key: "outah", label: "Outah (Ah)", color: "#78c004ff" },
        { key: "batvoltage", label: "Battery voltage (%)", color: "#fef18aff" },
        { key: "ntc1", label: "Positive terminal temp(°C)", color: "#a8f8ffff" },
        { key: "ntc2", label: "Cell no 20 temp (°C)", color: "#ee71fcff" },
        { key: "ntc3", label: "Cell no 50 temp (°C)", color: "#9b97f4ff" },
        { key: "ntc4", label: "Negative terminal temp(°C)", color: "#46f6bbff" },
        { key: "mos1", label: "Main charge mosfet", color: "#f97316" },
        { key: "mos2", label: "Main discharge mosfet", color: "#14b8a6" },
        { key: "mos3", label: "APU charge mosfet", color: "#8b5cf6" },
        { key: "mos4", label: "APU discharge mosfet", color: "#e11d48" }, 
        { key: "mainMinVoltage", label: "Main min cell voltage (V)", color: "#60a5fa" },
        { key: "mainMaxVoltage", label: "Main max cell voltage (V)", color: "#2563eb" },
        { key: "mainMinCell", label: "Main min cell no", color: "#a1a1aa" },
        { key: "mainMaxCell", label: "Main max cell no", color: "#eab308" },
        ];

                const handleMetricChange = (key) => {
                  if (metricsSelected.includes(key)) {
                    setMetricsSelected(metricsSelected.filter((m) => m !== key));
                  } else {
                    setMetricsSelected([...metricsSelected, key]);
                  }
                };

                const handleMetricChange1 = (key) => {
                  setMetricsSelected1((prev) =>
                    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                  );
                };

                // Fetch live telemetry
                useEffect(() => {
                  if (!vin) return;

                  const apiUrl = `https://ble.nerdherdlab.com/telemery.php?vin=${vin}`;
                  const fetchData = async () => {
                try {
                  const res = await fetch(apiUrl);
                  const json = await res.json();
                
                  if (Array.isArray(json)) {
                    setLivedatafor(json);
                  } else {
                    setLivedatafor([]); // fallback if error object
                  }
                } catch (err) {
                  console.error("Fetch error:", err);
                  setLivedatafor([]);
                }
              };


                  fetchData();
                  const interval = setInterval(fetchData, 1000); // refresh every 2 sec
                  return () => clearInterval(interval);
                }, [vin]);


                const latestNtc =
                livedatafor?.length > 0
                ? livedatafor[livedatafor.length - 1]?.ntc || []
                : [];

                /* ================= CELL DECODER ================= */

function getStartCell(label) {
  if (label.includes("1to3")) return 1;
  const match = label.match(/cell(\d+)to(\d+)/);
  return match ? Number(match[1]) : null;
}

function parseNTCCells(ntc) {
  const cells = Array.from({ length: 23 }, (_, i) => ({
    cell: i + 1,
    voltage: null
  }));

  if (!Array.isArray(ntc)) return cells;

  ntc.forEach((line) => {
    if (typeof line !== "string") return;

    const match = line.match(
      /(AllCells 1to3|cell\d+to\d+)=(null|[0-9A-Fa-f]+)/
    );
    if (!match) return;

    const label = match[1];
    const raw = match[2];

    const startCell = getStartCell(label);
    if (!startCell || raw === "null") return;

    const cellCount = label.includes("22to23") ? 2 : 3;
    const clean = raw.slice(0, -2);

    for (let i = 0; i < cellCount; i++) {
      const hex = clean.slice(i * 4, i * 4 + 4);
      if (hex.length !== 4) continue;

      const voltage = parseInt(hex, 16) / 1000;
      const idx = startCell - 1 + i;

      if (idx < 23 && voltage > 0 && voltage < 6) {
        cells[idx].voltage = voltage;
      }
    }
  });

  return cells;
}


    

                // Preprocess data for chart
     const processedData = Array.isArray(livedatafor)
  ? livedatafor.map((item) => {
      let ntcValues = [];
      let mosValues = [];
      let mainMinVoltage = null;
      let mainMaxVoltage = null;
      let mainMinCell = null;
      let mainMaxCell = null;

      /* ================= MOS & NTC ================= */

      if (Array.isArray(item.ntc)) {
        // --- Extract MOS values ---
        const mosIndex = item.ntc.findIndex(
          (v) => typeof v === "string" && v.includes("MOS=")
        );

        if (mosIndex !== -1) {
          const mosString = item.ntc[mosIndex];
          const mosMatch = mosString.match(/MOS=([\d,]+)/);

          if (mosMatch) {
            mosValues = mosMatch[1].split(",").map(Number);
          }

          for (let i = mosIndex + 1; i < item.ntc.length; i++) {
            const val = parseInt(item.ntc[i]);
            if (!isNaN(val)) mosValues.push(val);
            else break;
          }

          mosValues = mosValues.map((v) =>
            v === 1 ? "ON" : v === 0 ? "OFF" : null
          );
        }

        // --- Extract NTC values ---
        const ntcIndex = item.ntc.findIndex(
          (v) => typeof v === "string" && v.includes("ntc=")
        );

        if (ntcIndex !== -1) {
          ntcValues = item.ntc.slice(ntcIndex).flatMap((v) => {
            if (typeof v === "string" && v.includes("ntc=")) {
              const match = v.match(/ntc=(-?\d+)/);
              return match ? [parseFloat(match[1])] : [];
            }
            const num = parseFloat(v);
            return isNaN(num) ? [] : [num];
          });
        }

        /* ================= ICV ================= */

        const icvItem = item.ntc.find(
          (v) => typeof v === "string" && v.includes("ICV=")
        );

        if (icvItem) {
          const match = icvItem.match(/ICV=(\w+)/);
          if (match) {
            const icv = match[1];

            const hexToDec = (hex) => parseInt(hex, 16);
            const hexToFloat = (hex) => parseInt(hex, 16) / 1000;

            mainMaxVoltage = hexToFloat(icv.slice(0, 4)).toFixed(3);
            mainMaxCell = hexToDec(icv.slice(4, 6));
            mainMinVoltage = hexToFloat(icv.slice(6, 10)).toFixed(3);
            mainMinCell = hexToDec(icv.slice(10, 12));
          }
        }
      }

      /* ================= CELL VOLTAGES (23) ================= */

      const decodedCells = Array.isArray(item.ntc)
        ? parseNTCCells(item.ntc)
        : [];

      const cellVoltages = {};
      decodedCells.forEach((c) => {
        cellVoltages[`cell${c.cell}`] = c.voltage;
      });

      /* ================= FINAL RETURN ================= */

      return {
        time: item.time,

        currentPositive:
          item.currentconsumption > 0 ? item.currentconsumption : 0,
        currentNegative:
          item.currentconsumption < 0
            ? Math.abs(item.currentconsumption)
            : 0,

        speed_kmph: item.speed_kmph,
        motortemp: item.motortemp,
        controllermostemp: item.controllermostemp,
        batvoltage: item.batvoltage,
        soc: item.soc,
        inah: item.inah,
        outah: item.outah,
        lat_long: item.lat_long ?? null,
        tripkm: item.tripkm,

        // MOS
        mos1: mosValues?.[0] ?? null,
        mos2: mosValues?.[1] ?? null,
        mos3: mosValues?.[2] ?? null,
        mos4: mosValues?.[3] ?? null,

        // NTC
        ntc1: ntcValues?.[0] ?? null,
        ntc2: ntcValues?.[1] ?? null,
        ntc3: ntcValues?.[2] ?? null,
        ntc4: ntcValues?.[3] ?? null,
        ntc5: ntcValues?.[4] ?? null,
        ntc6: ntcValues?.[5] ?? null,
        ntc7: ntcValues?.[6] ?? null,
        ntc8: ntcValues?.[7] ?? null,

        // ICV
        mainMinVoltage,
        mainMaxVoltage,
        mainMinCell,
        mainMaxCell,

        // ✅ 23 CELLS (THIS WAS THE MISSING PART)
        ...cellVoltages,
      };
    })
  : [];




   const processedData1 = Array.isArray(historyData)
  ? historyData.map((item) => {
      let ntcValues = [];
      let mosValues = [];
      let mainMinVoltage = null;
      let mainMaxVoltage = null;
      let mainMinCell = null;
      let mainMaxCell = null;

      if (Array.isArray(item.ntc)) {
        // 1️⃣ --- Extract MOS values ---
        const mosIndex = item.ntc.findIndex(
          (v) => typeof v === "string" && v.includes("MOS=")
        );
        if (mosIndex !== -1) {
          const mosString = item.ntc[mosIndex];
          const mosMatch = mosString.match(/MOS=([\d,]+)/);
          if (mosMatch) {
            mosValues = mosMatch[1].split(",").map((n) => parseInt(n));
          }

          // Include next numeric values after MOS= if they exist
          for (let i = mosIndex + 1; i < item.ntc.length; i++) {
            const val = parseInt(item.ntc[i]);
            if (!isNaN(val)) mosValues.push(val);
            else break;
          }

          // 🟢 Convert MOS 1/0 to "ON"/"OFF"
          mosValues = mosValues.map((v) =>
            v === 1 ? "ON" : v === 0 ? "OFF" : null
          );
        }

        // 2️⃣ --- Extract NTC values ---
        const ntcIndex = item.ntc.findIndex(
          (v) => typeof v === "string" && v.includes("ntc=")
        );
        if (ntcIndex !== -1) {
          ntcValues = item.ntc.slice(ntcIndex).flatMap((v) => {
            if (typeof v === "string" && v.includes("ntc=")) {
              const match = v.match(/ntc=(-?\d+)/);
              return match ? [parseFloat(match[1])] : [];
            }
            const num = parseFloat(v);
            return isNaN(num) ? [] : [num];
          });
        }

        // 3️⃣ --- 🟢 Extract ICV data (Main Min/Max Voltage & Cell Numbers) ---
        const icvItem = item.ntc.find(
          (v) => typeof v === "string" && v.includes("ICV=")
        );
        if (icvItem) {
          const match = icvItem.match(/ICV=(\w+)/);
          if (match) {
            const icv = match[1];

            // Extract hex parts
            const maxValHex = icv.slice(0, 4);
            const maxNoHex = icv.slice(4, 6);
            const minValHex = icv.slice(6, 10);
            const minNoHex = icv.slice(10, 12);

            // Conversion helpers
            const hexToDec = (hex) => parseInt(hex, 16);
            const hexToFloat = (hex) => parseInt(hex, 16) / 1000;

            // Final decoded values
            mainMaxVoltage = hexToFloat(maxValHex).toFixed(3);
            mainMaxCell = hexToDec(maxNoHex);
            mainMinVoltage = hexToFloat(minValHex).toFixed(3);
            mainMinCell = hexToDec(minNoHex);
          }
        }
      }

      return {
        time: item.time,
        currentPositive: item.currentconsumption > 0 ? item.currentconsumption : 0,
        currentNegative: item.currentconsumption < 0 ? Math.abs(item.currentconsumption) : 0,
        speed_kmph: item.speed_kmph,
        motortemp: item.motortemp,
        controllermostemp: item.controllermostemp,
        batvoltage: item.batvoltage,
        soc: item.soc,
        inah: item.inah,
        outah: item.outah,
        lat_long: item.lat_long ?? null,
        tripkm: item.tripkm,

        // ✅ MOS values converted to ON/OFF
        mos1: mosValues?.[0] ?? null,
        mos2: mosValues?.[1] ?? null,
        mos3: mosValues?.[2] ?? null,
        mos4: mosValues?.[3] ?? null,

        // ✅ NTC values
        ntc1: ntcValues?.[0] ?? null,
        ntc2: ntcValues?.[1] ?? null,
        ntc3: ntcValues?.[2] ?? null,
        ntc4: ntcValues?.[3] ?? null,
        ntc5: ntcValues?.[4] ?? null,
        ntc6: ntcValues?.[5] ?? null,
        ntc7: ntcValues?.[6] ?? null,
        ntc8: ntcValues?.[7] ?? null,

        // ✅ ICV decoded values
        mainMinVoltage,
        mainMaxVoltage,
        mainMinCell,
        mainMaxCell,
      };
    })
  : [];




      useEffect(() => {
        if (!vin) return;

        const fetchNtc = () => {
          fetch(`https://ble.nerdherdlab.com/latest_ntc.php?vin=${vin}`)
            .then(res => res.json())
            .then(json => setNtcData(json))
            .catch(err => console.error("NTC fetch error:", err));
        };

        // Fetch immediately
        fetchNtc();

        // Set interval to fetch every 2 seconds (2000 ms)
        const intervalId = setInterval(fetchNtc, 1000);

        // Cleanup interval on unmount or when vin changes
        return () => clearInterval(intervalId);
      }, [vin]);

              // Search API call
                useEffect(() => {
                  if (isSelected) return; // don’t refetch once a VIN is chosen

                  if (searchValue.trim().length < 2) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                    return;
                  }

                  const fetchSuggestions = async () => {
                    try {
                      const res = await fetch(
                        `https://ble.nerdherdlab.com/search_vehicle.php?q=${searchValue}`
                      );
                      const data = await res.json();

                      if (Array.isArray(data) && data.length > 0) {
                        setSuggestions(data);
                        setShowSuggestions(true);
                      } else {
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }

                      setHighlightIndex(-1);
                    } catch (err) {
                      console.error("Error fetching suggestions", err);
                      setShowSuggestions(false);
                    }
                  };

                  fetchSuggestions();
                }, [searchValue, isSelected]);

                // ✅ Central function to finalize selection + fetch
                const handleSelect = (vinNumber) => {
                  setSearchValue(vinNumber);
                  setVin(vinNumber); // 🚀 actual fetch triggered
                  setIsSelected(true);
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setHighlightIndex(-1);
                };



              async function fetchLatestByVin(v) {
                if (!v) return;
                try {
                  const res = await fetch(`https://ble.nerdherdlab.com/socapulastdata.php?vin=${encodeURIComponent(v)}`);
                  const json = await res.json();
                  if (!json || json.error) return;
                  setLatestGauges(json);
                } catch (e) {
                  console.error("latest_by_vin error", e);
                }
              }

              useEffect(() => {
                const trimmedVin = vin?.trim();
                if (!trimmedVin) {
                  setDetails(null);
                  return;
                }
                if (!vin) return;
                fetchLatestByVin(vin);
                
                const id = setInterval(() => fetchLatestByVin(vin), 5000);

                return () => clearInterval(id);
              }, [vin]);


              // fetchLiveData



              //   useEffect(() => {
              //   const trimmedVin = vin?.trim();
              //   if (!trimmedVin) {
              //     setDetails(null);
              //     setLiveData([]); 
              //     return;
              //   }
              //   const fetchLiveData = async () => {
              //     try {
              //       const res = await fetch(
              //         `https://ble.nerdherdlab.com /selcectvinlastdata.php?vin=${trimmedVin}`
              //       );
              //       if (!res.ok) throw new Error(`HTTP ${res.status}`);
              //       const json = await res.json();
              //       const arr = Array.isArray(json) ? json : json ? [json] : [];
              //       setLiveData(arr.reverse());
              //     } catch (err) {
              //       console.error("Live telemetry fetch error:", err);
              //     }
              //   };

              //   fetchLiveData();
              //   const interval = setInterval(fetchLiveData, 3000);
              //   return () => clearInterval(interval);
              // }, [vin]);


useEffect(() => {
  const trimmedVin = vin?.trim();

  // Reset when VIN is empty
  if (!trimmedVin) {
    setDetails(null);
    setLiveData([]);
    return;
  }

  const fetchLiveData = async () => {
    try {
      const res = await fetch(
        `https://ble.nerdherdlab.com/selcectvinlastdata.php?vin=${trimmedVin}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const arr = Array.isArray(json) ? json : [];

      // Backend gives DESC, UI expects ASC
      setLiveData(arr.reverse());
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    }
  };

  // 1️⃣ Initial load: last 200 when VIN changes
  fetchLiveData();

  // 2️⃣ Near real-time polling every 3 seconds
  const interval = setInterval(fetchLiveData, 3000);

  // 3️⃣ Cleanup on VIN change / unmount
  return () => clearInterval(interval);

}, [vin]);

                useEffect(() => {
                  (async () => {
                    try {
                      const res = await fetch(`https://ble.nerdherdlab.com/all_vinfetch.php`);
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      const json = await res.json();
                      if (Array.isArray(json) && json.length > 0) {
                        setVinList(json);
                        if (!initialVin) setVin(json[0]);
                      } else {
                        setVinList([]);
                        setVin("");
                      }
                    } catch (e) {
                      console.error("VIN list error", e);
                    }
                  })();
                }, [initialVin]);

                // // Date and time 
              function getCurrentDateTimeLocal(date) {
                const offset = date.getTimezoneOffset(); 
                const local = new Date(date.getTime() - offset * 60000);
                return local.toISOString().slice(0, 16);
              }

                // Vehicle details by VIN
              useEffect(() => {
                const trimmedVin = vin?.trim();
                if (!trimmedVin) {
                  setDetails(null);
                  return;
                }
              
                let intervalId;
              
                const fetchDetails = async () => {
                  try {
                    const res = await fetch(
                      `https://ble.nerdherdlab.com/fetch_allvinmodeldtat.php?vin=${encodeURIComponent(trimmedVin)}`
                    );
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json = await res.json();
                    setDetails(json?.data || {});
                  } catch (e) {
                    console.error("Vehicle details error", e);
                  }
                };
              
                // 🔹 fetch immediately
                fetchDetails();
              
                // 🔹 then poll every 5s (or 1s if you need super live updates)
                intervalId = setInterval(fetchDetails, 5000);
              
                // cleanup
                return () => clearInterval(intervalId);
              }, [vin]);



                // const fetchLast200Data = async () => {
                //   if (!vin) return;
                //   try {
                //     const res = await fetch(
                //       `https://ble.nerdherdlab.com /selcectvinlastdata.php?vin=${vin}`
                //     );
                //     if (!res.ok) throw new Error(`HTTP ${res.status}`);
                //     const json = await res.json();
                //     const arr = Array.isArray(json) ? json : json ? [json] : [];
                //     setLiveData(arr.reverse()); 
                //   } catch (e) {
                //     console.error("History error", e);
                //   }
                // };
                // useEffect(() => {
                //   if (!vin) return;
                //   fetchLast200Data();
                // }, [vin]);





                const fetchRealtimeData = async () => {
                  if (!vin) return;
                  try {
                    const res = await fetch(`https://ble.nerdherdlab.com/real_timedata1.php`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json = await res.json();
                    const arr = Array.isArray(json) ? json : json ? [json] : [];
                    setData(arr.reverse());
                  } catch (e) {
                    console.error("Realtime error", e);
                  }
                };
                useEffect(() => {
                  if (!vin) return;
                  let intv;
                  if (mode === "realtime") {
                    fetchRealtimeData();
                    intv = setInterval(fetchRealtimeData, 5000);
                  }
                  return () => intv && clearInterval(intv);
                }, [vin, mode]);


      // ✅ Get local datetime in input-compatible format
        function getCurrentDateTimeLocal(date) {
          const offset = date.getTimezoneOffset();
          const local = new Date(date.getTime() - offset * 60000);
          return local.toISOString().slice(0, 16);
        }

      // ✅ Convert to UTC string for API
        const toUTC = (date) => {
          const d = new Date(date);
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
        };
      // ✅ Handlers (manual selection disables auto mode)
      const handleStartChange = (val) => {
          setStartDateTime(val);
          setAutoMode(false); // stop auto
        };
        const handleEndChange = (val) => {
          setEndDateTime(val);
          setAutoMode(false); // stop auto
        };

        const resetToAuto = () => {
          setAutoMode(true);
          setStartDateTime(getCurrentDateTimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
          setEndDateTime(getCurrentDateTimeLocal(new Date()));
        };

      // ✅ Auto-refresh effect (runs only when autoMode = true)
        useEffect(() => {
          if (!autoMode) return;

          const updateRange = () => {
            setStartDateTime(getCurrentDateTimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
            setEndDateTime(getCurrentDateTimeLocal(new Date()));
          };

          updateRange(); // first run
          const timer = setInterval(updateRange, 60000);

          return () => clearInterval(timer);
        }, [autoMode]);

      // ✅ Fetch data
      const fetchHistoricalData = async () => {
          if (!vin || !startDateTime || !endDateTime) {
            setAlertMessage("Please select VIN Number.");
            return;
          }

          setLoading(true);
          setShowHistoryChart(false);

          try {
            const url = `https://ble.nerdherdlab.com/backtimedatfetch.php?vin=${encodeURIComponent(
              vin
            )}&start=${encodeURIComponent(toUTC(startDateTime))}&end=${encodeURIComponent(
              toUTC(endDateTime)
            )}`;

            console.log("Fetching:", url);
            const res = await fetch(url);
            const text = await res.text();
            const json = JSON.parse(text);
            const data = json.data || json;

            if (Array.isArray(data) && data.length > 0) {
              setHistoryData(data.reverse());
              setShowHistoryChart(true);
            } else {
              setHistoryData([]);
              setShowHistoryChart(false);
              setAlertMessage("No data available in this range.");
            }
          } catch (err) {
            console.error("Error loading history:", err);
            setAlertMessage("Failed to load data.");
          } finally {
            setLoading(false);
          }
        };

      // 📌 Utility function (with caching)
      async function getReadableLocation(lat_long) {
        if (!lat_long) return "N/A";

        let lat, lng;

        if (typeof lat_long === "object") {
          if (Array.isArray(lat_long)) {
            [lat, lng] = lat_long;
          } else {
            lat = lat_long.lat ?? lat_long.latitude;
            lng = lat_long.lng ?? lat_long.lon ?? lat_long.longitude;
          }
        } else if (typeof lat_long === "string" && lat_long.includes(",")) {
          [lat, lng] = lat_long.split(",").map((n) => parseFloat(n.trim()));
        }

        lat = parseFloat(lat);
        lng = parseFloat(lng);
        if (isNaN(lat) || isNaN(lng)) return "N/A";

        // ✅ LocalStorage cache
        const cacheKey = `loc:${lat.toFixed(5)},${lng.toFixed(5)}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: {
                "User-Agent": "YourAppName/1.0 (your@email.com)", // required by Nominatim
                "Accept-Language": "en", // optional, force English
              },
            }
          );
          const data = await res.json();
          const result = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

          localStorage.setItem(cacheKey, result); // save for next time
          return result;
        } catch {
          return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
      }

      // 📌 Effect to process all lat/longs safely
      useEffect(() => {
        if (!processedData?.length) return;

        // collect unique lat_long values
        let queue = [...new Set(processedData.map((row) => row.lat_long).filter(Boolean))];

        let i = 0;
        const interval = setInterval(() => {
          if (i >= queue.length) {
            clearInterval(interval);
            return;
          }

          const latlong = queue[i];
          if (latlong && !locationMap[latlong]) {
            getReadableLocation(latlong).then((name) => {
              setLocationMap((prev) => ({ ...prev, [latlong]: name }));
            });
          }

          i++;
        }, 1100); // ⏱ one request every ~1.1 sec

        return () => clearInterval(interval);
      }, [processedData]);

            const latest = useMemo(() => (data?.length ? data[0] : {}), [data]);

          return (
      <div class="min-h-screen bg-black text-white">
      <div>
    <header
  className={`fixed top-2 z-[2000] p-3 ml-2 
    bg-[#0d0d0d]/70 backdrop-blur-xl transition-all duration-500
    ${
      isScrolled
        ? "h-20 rounded-2xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        : "h-20 border-b border-white/10 rounded-none shadow-none"
    }
    ${
      isCollapsed
        ? "left-16 w-[calc(100%-4rem-1rem)] hidden sm:block"
        : "left-56 w-[calc(100%-14rem-1rem)] hidden sm:block"
    }
    sm:flex items-center`}
>
  <div className="flex h-full w-full items-center justify-between px-6">
   
    <div className="flex items-center gap-3">
      <img
        src="https://image2url.com/images/1755511837883-d480dc7d-7419-4341-acc6-decf0d6810b5.png"
        alt="Rivot Motors"
        className="h-10 drop-shadow-md"
      />
      <h1 className="text-white font-Blank tracking-wide sm:text-xl">
        <span className="text-white">RIVOT MOTORS</span>{" "}
        <span className="text-white">COMMAND CENTER</span>
      </h1>
    </div>

    <div className="flex items-center gap-2 w-full max-w-md justify-end">
    
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setIsSelected(false);
          }}
          onKeyDown={(e) => {
            if (!showSuggestions || suggestions.length === 0) {
              if (e.key === "Enter" && searchValue.trim() !== "") {
                e.preventDefault();
                handleSelect(searchValue);
              }
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : 0
              );
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIndex((prev) =>
                prev > 0 ? prev - 1 : suggestions.length - 1
              );
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (highlightIndex >= 0 && suggestions[highlightIndex]) {
                handleSelect(suggestions[highlightIndex].vinnumber);
              } else {
                handleSelect(searchValue);
              }
            } else if (e.key === "Escape") {
              setShowSuggestions(false);
              setHighlightIndex(-1);
            }
          }}
          placeholder="Search by VIN / Name / Phone"
          className="w-full rounded-full border border-white/10 bg-white/5 pl-9 pr-16 py-2.5 text-sm text-white outline-none
            transition-all duration-300 
            hover:border-orange-400 focus:border-orange-500 focus:bg-white/10 shadow-inner"
        />

        {searchValue && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setSearchValue("");
              setIsSelected(false);
              setHighlightIndex(-1);
              setShowSuggestions(false);
              requestAnimationFrame(() => {
                inputRef.current?.focus();
              });
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400 transition"
          >
            ✕
          </button>
        )}

        
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full mt-2 w-full rounded-xl bg-[#0d0d0d]/95 border border-white/10 max-h-60 overflow-y-auto shadow-xl z-20">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => handleSelect(s.vinnumber)}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  i === highlightIndex
                    ? "bg-orange-500/40 text-white"
                    : "hover:bg-orange-500/20"
                }`}
              >
                <div className="font-medium">{s.vinnumber}</div>
                <div className="text-xs text-gray-400">
                  {s.ownername} • {s.phonenumber}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

     
      <button
        onClick={() => {
          if (searchValue.trim() !== "") {
            handleSelect(searchValue);
          }
        }}
        className="px-4 py-2 rounded-full 
          bg-gradient-to-tr from-orange-500 to-yellow-400 
          text-black font-Kanit text-sm
          hover:scale-105 hover:shadow-md 
          transition-all duration-300"
      >
        Go
      </button>

      
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-full 
          bg-gradient-to-tr from-orange-500 to-yellow-400 
          text-black font-Kanit text-sm
          hover:scale-105 hover:shadow-md 
          transition-all duration-300"
      >
        Logout
      </button>

   
    </div>
  </div>
</header>


      <header
        className={`sm:hidden fixed top-2 left-2 right-2 z-[1000]  flex flex-col gap-2 
          bg-[#0d0d0d]/80 backdrop-blur-xl px-4 pt-2
          transition-all duration-500 
          ${
            isScrolled
              ? "rounded-2xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              : "border-b border-white/10 rounded-none shadow-none"
          }
      `}
      >
        {/* 🔹 Top Row: Menu + Logo + Logout */}
        <div className="flex items-center justify-between">
          {/* Left: Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-shrink-0 p-2 rounded-full hover:bg-white/10 transition"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* Center: Logo */}
          <img
            src="https://image2url.com/images/1755511837883-d480dc7d-7419-4341-acc6-decf0d6810b5.png"
            alt="Rivot Motors"
            className="h-8"
          />

          {/* Right: Logout */}
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-full 
              bg-gradient-to-tr from-orange-500 to-yellow-400 text-black
              hover:scale-105 hover:shadow-md transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5m-4 1H7a2 2 0 00-2 2v10a2 2 0 002 2h2"
              />
            </svg>
          </button>
        </div>

        {/* 🔹 Bottom Row: Search Bar */}
      {/* 🔹 Bottom Row: Modern Search Bar */}
      <div className="w-full flex flex-col items-center pb-2">
        <div className="flex items-center w-full rounded-xl border border-white/10 bg-[#1a1a1a] 
                        px-3 py-2 shadow-inner 
                        hover:border-orange-400 focus-within:border-orange-500
                        transition-all duration-300">
          
          {/* Search Icon */}
          <Search
            className={`w-5 h-5 mr-2 transition-colors
              ${searchValue ? "text-orange-400" : "text-gray-400"}
            `}
          />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setIsSelected(false);
            }}
            onKeyDown={(e) => {
              if (!showSuggestions || suggestions.length === 0) {
                if (e.key === "Enter" && searchValue.trim() !== "") {
                  e.preventDefault();
                  handleSelect(searchValue);
                }
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((prev) =>
                  prev < suggestions.length - 1 ? prev + 1 : 0
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((prev) =>
                  prev > 0 ? prev - 1 : suggestions.length - 1
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (highlightIndex >= 0 && suggestions[highlightIndex]) {
                  handleSelect(suggestions[highlightIndex].vinnumber);
                } else {
                  handleSelect(searchValue);
                }
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
                setHighlightIndex(-1);
              }
            }}
            placeholder="Search by VIN / Name / Phone"
            className="flex-grow bg-transparent text-sm text-white placeholder-gray-400 
                      outline-none"
          />

          {/* Clear Button */}
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                setIsSelected(false);
                setHighlightIndex(-1);
                setShowSuggestions(false);
                if (inputRef.current) inputRef.current.focus();
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full 
                        text-gray-400 hover:text-orange-400 transition mr-1"
            >
              ✕
            </button>
          )}

          <button
            onClick={() => {
              if (searchValue.trim() !== "") handleSelect(searchValue);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full
              bg-gradient-to-tr from-orange-500 to-yellow-400 text-black
              hover:scale-110 hover:shadow-md transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="mt-2 w-full rounded-xl bg-[#0d0d0d]/95 border border-white/10 shadow-xl max-h-44 overflow-y-auto z-50 text-sm">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => handleSelect(s.vinnumber)}
                className={`px-3 py-2 cursor-pointer ${
                  i === highlightIndex
                    ? "bg-orange-500/40 text-white"
                    : "hover:bg-orange-500/20"
                }`}
              >
                <div className="font-medium">{s.vinnumber}</div>
                <div className="text-xs text-gray-400">
                  {s.ownername} • {s.phonenumber}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      </header>

      <div className="min-h-screen bg-black text-white  ml-0">
        {/* Sidebar */}
      <div
        className={`${
          isCollapsed ? "w-16" : "w-56"
        } hidden sm:flex fixed top-0 left-0 h-screen
        bg-[#0d0d0d]/90 backdrop-blur-xl border-r border-white/10 
        text-white flex-col transition-all duration-300 z-20 shadow-lg`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-8 mt-4 flex items-center justify-center w-10 h-10 mx-auto 
                    rounded-xl bg-gradient-to-tr from-orange-500 to-yellow-400 text-black 
                    hover:scale-105 hover:shadow-md transition"
        >
          {isCollapsed ? (
            <Menu size={20} /> 
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
        <ul className="space-y-2 flex-1 px-2">
          {[
            { id: "home", label: "Dashboard", icon: <Home size={20} /> },
            { id: "graph", label: "Graph", icon: <BarChart2 size={20} /> },
            { id: "table", label: "Table", icon: <Table size={20} /> },
            { id:"world",    label:"Geo location",    icon:  <Map size={20}/>},
            { id:"tickets",   label:"Tickets",    icon:  <Ticket size={20}/>},
            { id:"commad",   label:"Command",   icon:  <Command size={20}/>},
             

          ].map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                  transition-all duration-300 relative group
                  ${
                    activePage === item.id
                      ? "bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-Kanit shadow-md"
                      : "hover:bg-white/10 text-gray-300"
                  }`}
              >
                <div
                  className={`flex items-center justify-center transition-all duration-300
                    ${activePage === item.id ? "text-black" : "text-gray-400 group-hover:text-orange-400"}
                  `}
                >
                  {item.icon}
                </div>
                {!isCollapsed && <span>{item.label}</span>}
                {activePage === item.id && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-lg"></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {/* 🔹 Overlay with Fade */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 
                      transition-opacity duration-500 animate-fadeIn"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* 🔹 Drawer */}
      <div
        className={`fixed top-0 left-0 h-full 
          w-[45%] max-w-sm sm:w-56   /* 📱 Phone ~75%, 💻 Desktop fixed */
          bg-[#0d0d0d]/95 backdrop-blur-xl border-r border-white/10 
          shadow-2xl z-[1000] 
          transform transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >

          {/* Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mb-8 mt-4 flex items-center justify-end w-full 
                      px-2 text-gray-400 hover:text-orange-400 
                      transition-colors duration-300"
          >
            <X size={24} />
          </button>

          {/* Navigation */}
          <ul className="space-y-3">
            {[
              { id: "home", label: "Dashboard", icon: <Home size={20} /> },
              { id: "graph", label: "Graph", icon: <BarChart2 size={20} /> },
              { id: "table", label: "Table", icon: <Table size={20} /> },
              { id:"world",    label:"Geo location",    icon:  <Map size={20}/>},
              { id:"tickets",    label:"Tickets",    icon:  <Ticket size={20}/>},
              { id:"commad",   label:"Command",   icon:  <Ticket size={20}/>},
              

            ].map((item) => (
              <li key={item.id}>
          <button
        onClick={() => {
          setActivePage(item.id);
          setSidebarOpen(false); // 👈 closes sidebar automatically
        }}
        className={`flex items-center gap-3 w-full px-4 py-2.5 
          rounded-xl transition-all duration-300 relative group
          ${
            activePage === item.id
              ? "bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-Kanit shadow-md"
              : "hover:bg-white/10 text-gray-300"
          }`}
      >
        {/* Icon */}
        <span
          className={`transition-colors duration-300 ${
            activePage === item.id
              ? "text-black"
              : "text-gray-400 group-hover:text-orange-400"
          }`}
        >
          {item.icon}
        </span>

        {/* Label */}
        <span>{item.label}</span>

        {/* Active Glow Indicator */}
        {activePage === item.id && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-lg bg-orange-500 shadow-[0_0_10px_rgba(255,153,19,0.7)]"></span>
        )}
      </button>
              </li>
            ))}
          </ul>
      </div>
      </div>

        {/* Main Content */}
      <main
        ref={mainRef}
        className="flex-1 p-3 bg-transparent text-white 
                  transition-all duration-300 overflow-y-auto"
        style={{
          marginLeft: window.innerWidth < 640 ? "0" : isCollapsed ? "4rem" : "14rem", // ✅ sync with w-16 & w-56
          paddingTop: window.innerWidth < 640 ? "7.5rem" : "6rem",
        }}
      >
          {activePage === "home" && (
            <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-3 mb-3">
        {/* VIN Number */}
        <StatCard
          label="VIN-Number"
          value={details?.vinnumber || details?.vinNumber || vin || "N/A"}
          icon={CreditCard}
        />
        {/* Owner */}
        <StatCard
          label="Owner"
          value={details?.ownerName || details?.ownername || "N/A"}
          icon={User}
        />
        {/* Phone */}
        <StatCard
          label="Phone"
          value={details?.phoneNumber || details?.phonenumber || "N/A"}
          icon={Phone}
        />
        {/* 📍 Location */}
        <div className="sm:col-span-2 lg:col-span-2">
         <StatCard
  icon={MapPin}
  valueClassName="font-medium text-blue-300 w-full block text-[clamp(12px,1vw,16px)] break-words leading-snug line-clamp-2"
  value={
    locationData ? (
      <div className="flex flex-col space-y-1 text-left flex-1 w-full">
        <a
          href={locationData.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:underline break-words line-clamp-2"
        >
          {locationData.locationName ||
            `${locationData.lat.toFixed(5)}, ${locationData.lng.toFixed(5)}`}
        </a>
        <span className="text-[11px] text-orange-400 font-medium flex items-center gap-2">
        <span className="text-gray-400">Last updated:</span>
        {locationData.formattedTime}

        {mapsFlag === "1" && (
          <span className="text-yellow-400 font-semibold">
            • Map request has been raised
          </span>
        )}
      </span>

      </div>
    ) : (
      "N/A"
    )
  }
/>

        </div>
      </div>
      {/* 🔹 Outer container for all cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
      <div
        className="relative rounded-2xl p-3 
                  bg-neutral-950 border border-white/10 
                  text-white shadow-lg 
                  transition-colors duration-300 hover:border-orange-500
                  flex flex-col md:col-span-5 "
      >
        {/* 🔹 Component Data Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3  relative z-10 " >
          <StatChip label="Controller serial No." value={details?.controllerid || "N/A"} />
          <StatChip label="Motor serial No." value={details?.motorid || "N/A"} />
          <StatChip label="BMS serial No." value={details?.bmsid || "N/A"} />
          <StatChip label="comfortKey ID" value={details?.smartkeyid || "N/A"} />
          <StatChip label="Charger serial No." value={details?.chargerid ?? "N/A"} />
          <StatChip label="BMS life cycles" value={details?.bmslifecycles ?? "N/A"} />
          <StatChip label="Current rider" value={details?.riders ?? "N/A"} />
          <StatChip
            label="rideOS version"
            value={
              <div className="flex flex-col leading-tight">
                <span className="pb-0.5">{details?.rideosversion ?? "N/A"}</span>
                <span className="text-xs text-gray-400">Up time: {details?.bmsmosstates
                  ? details.bmsmosstates.split("-")[1] || "N/A"
                  : "N/A"}
                </span>
              </div>
            }
          />
          <StatChip label="Model" value={details?.model ?? "N/A"} />
       <StatChip
  // label="Lock Status"
  value={(() => {
    const handleLocked = Number(details?.handlelockstate) !== 1;

    const powerState =
      (latestGauges?.ev_power_state || "").split(",")[0].trim();

    const scooterLocked = powerState !== "ON";

    return (
      <div className="flex flex-col gap-1 text-sm font-Kanit">
        {/* Handle Lock */}
        <div>
          <span className="text-[12px] sm:text-[13px] font-medium tracking-wide text-gray-400">Handle lock : </span>
          <span
            className={
              handleLocked
                ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
            }
          >
            {handleLocked ? "Locked" : "Unlocked"}
          </span>
        </div>

        {/* Scooter Lock */}
        <div>
          <span className="text-[12px] sm:text-[13px] font-medium tracking-wide text-gray-400">Scooter lock : </span>
          <span
            className={
              scooterLocked
                ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
            }
          >
            {scooterLocked ? "Locked" : "Unlocked"}
          </span>
        </div>
      </div>
    );
  })()}
/>

         <StatChip
  label="Charging state"
  value={
    Number(details?.chargingstate) === 1 ? (
      <span
        className="text-green-400 font-Kanit drop-shadow-[0_0_10px_rgba(34,197,94,0.9)]"
      >
        Charging
      </span>
    ) : Number(details?.chargingstate) === 2 ? (
      <span
        className="text-yellow-400 font-Kanit drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]"
      >
        Plugged in
      </span>
    ) : (
      <span
        className="text-gray-400 font-Kanit drop-shadow-[0_0_8px_rgba(156,163,175,0.8)]"
      >
        Not charging
      </span>
    )
  }
/>
<StatChip
  label={
    <div className="flex flex-col leading-tight text-gray-300">
      {/* <span>MCU Version :</span> */}
      {/* <span>APU Version :</span> */}
    </div>
  }
  value={
    <div className="flex flex-col leading-tight">
      {/* MCU Version value */}
      
      <span
        className={
          mcuVersion
            ? "text-cyan-400 font-Kanit "
            : "text-gray-400 font-Kanit"
        }
      >
       <span className="text-[12px] sm:text-[13px] font-medium tracking-wide text-gray-400">MCU Version :</span> {mcuVersion ?? "--"}
      </span>

      {/* APU Version value (placeholder) */}
     <span  className={
          mcuVersion
            ? "text-cyan-400 font-Kanit"
            : "text-gray-400 font-Kanit"
        }
      >
        <span className="text-[12px] sm:text-[13px] font-medium tracking-wide text-gray-400" >AOSPVersion:</span> <span className="text-[12px] sm:text-[13px] font-medium tracking-wide text-gray-400">{mapsaosp?? "--"}</span>

     </span>
    </div>
  }
/>






        </div>
      </div>

        <CustomAlert message={alertMessage} onClose={() => setAlertMessage("")} />

        {/* 🔹 Speed */}
      <div
        className="relative rounded-2xl p-4 
                  bg-neutral-950 border border-white/10 
                  text-white shadow-lg 
                  transition-all duration-300 hover:border-orange-500 
                  flex flex-col h-full md:col-span-3 "
      >
        <SectionTitle left="Speed" />

        <div className="flex justify-between mt-4">
          {/* Trip & Odo cards */}
          <div className="flex flex-col gap-7 ml-0">
  
            <div
        className="rounded-xl p-3 flex flex-col items-center text-center w-27
                  bg-gradient-to-br from-neutral-800 to-black 
                  border border-white/10 shadow-md
                  hover:border-orange-500 hover:shadow-orange-500/20 transition"
      >
        <p className="text-sm text-gray-400">Trip km</p>
        <h2 className="text-xl font-Kanit text-white">
          {latestGauges?.tripkm ?? "N/A"}
        </h2>
      </div>
            {/* Odo meter */}
          <div
        className="rounded-xl p-3 flex flex-col items-center text-center w-27
                  bg-gradient-to-br from-neutral-800 to-black 
                  border border-white/10 shadow-md
                  hover:border-orange-500 hover:shadow-orange-500/20 transition"
      >
        <p className="text-sm text-gray-400">Odo meter</p>
        <h2 className="text-xl font-Kanit text-white">
          {details?.odo !== undefined
            ? (Math.floor(details.odo * 100) / 100).toFixed(2)
            : "N/A"}
        </h2>
      </div>

          </div>

          {/* Gauge */}
          <div className="flex items-center justify-center flex-1 -mt-6 overflow-hidden">
            <ThreeQuarterGauge
              value={Number(latestGauges?.speed_kmph) || 0}
              max={120}
              unit="km/h"
              width={210}
            />
          </div>
        </div>
      </div>


        {/* 🔹 Main SOC */}
 <div
  className="relative rounded-2xl p-4 
    bg-neutral-950 border border-white/10 
    text-white shadow-lg 
    transition-all duration-300 hover:border-orange-500 
    flex flex-col h-full md:col-span-4"
>
  <SectionTitle left="Battery" />

  {/* ===== Battery Gauges Row ===== */}
  <div className="flex justify-center items-center gap-6 sm:gap-8 md:gap-8 mt-0">
    {/* 🔸 Left Small Gauge: APU SOC */}
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium text-gray-400 tracking-wide">
        APU SOC
      </p>
      <SpeedGaugesoc
        value={Number(latestGauges?.apusoc) || 0}
        max={100}
        width={120}
      >
        <h2 className="text-base font-semibold text-white">
          {Number(latestGauges?.apusoc).toFixed(0)}%
        </h2>
      </SpeedGaugesoc>
    </div>

    {/* 🔹 Right Large Gauge: Main SOC */}
    <div className="flex flex-col items-center">
      <p className="mb-0 text-sm font-medium text-gray-400 tracking-wide">
        Main SOC
      </p>
      <SpeedGaugesoc
        value={Number(latestGauges?.soc) || 0}
        max={100}
        width={220}
      >
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-3xl font-Kanit text-white leading-none">
            {Number(latestGauges?.soc).toFixed(0)}%
          </h2>
          <div className="w-[70px] h-[1px] bg-gray-600 my-1"></div>
          <p className="text-sm text-gray-400 leading-none">
            {Number(latestGauges?.batvoltage).toFixed(1)} V
          </p>
        </div>
      </SpeedGaugesoc>
    </div>
  </div>

  {/* ===== Max / Min Cell Compact Grid ===== */}
  {/* <div className="mt-[8px]"> 
  {latestGauges?.ntc && latestGauges?.ntc.includes("ICV=") && (() => {
    const match = latestGauges.ntc.match(/ICV=(\w+)/);
    if (!match) return null;

    const icv = match[1];

    const maxValHex = icv.slice(0, 4);
    const maxNoHex = icv.slice(4, 6);
    const minValHex = icv.slice(6, 10);
    const minNoHex = icv.slice(10, 12);

    const hexToDec = (hex) => parseInt(hex, 16);
    const hexToFloat = (hex) => parseInt(hex, 16) / 1000;

    const maxCellValue = hexToFloat(maxValHex).toFixed(3);
    const maxCellNumber = hexToDec(maxNoHex);
    const minCellValue = hexToFloat(minValHex).toFixed(3);
    const minCellNumber = hexToDec(minNoHex);

  
    return (
      <div className="text-sm text-gray-300">

        <div className="flex justify-around items-center text-center">

          
          <p className="text-[14px] text-gray-400">
            Min cell voltage :
            <span className="font-semibold text-white"> {minCellValue}</span>
            <span className="text-gray-300 text-white"> ({minCellNumber})</span>
          </p>

          <p className="text-[14px] text-gray-400">
            Max  cell voltage :
            <span className="font-semibold text-white"> {maxCellValue}</span>
            <span className="text-gray-300 text-white"> ({maxCellNumber})</span>
          </p>

        </div>

      </div>
    );
  })()}
</div> */}

</div>
</div>
        
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 h-auto md:h-[530px]">
        {/* --- Graph (60%) --- */}
      <div className="md:col-span-3 w-full h-[450px] sm:h-[450px] md:h-[530px] lg:max-h-[530px]">
        <div
          className="relative w-full h-full rounded-3xl bg-black
                    border border-[#FF9913] 
                    backdrop-blur-xl overflow-hidden
                    pb-0 sm:pb-3 md:pb-0 px-2 sm:px-3 md:px-4 hover:shadow-orange-500/20 transition"
        >
          {/* --- Toggle Button --- */}
          <button
            onClick={() => setShowMetrics(true)}
            className="absolute top-3 right-3 md:top-3 md:right-3 
                      z-20 px-2 py-1 text-xs md:text-sm
                      bg-[#0d0d0d] text-white border border-[#FF9913]/40 rounded-lg 
                      shadow hover:text-[#FF9913] transition"
          >
            Select parameters ▼
          </button>

          {/* --- Slide-out panel --- */}
          {showMetrics && (
        <>
          {/* 🔹 Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMetrics(false)}
          />

          {/* 🔹 Slide-out panel */}
          <div
            className="fixed top-2 right-2 h-full w-64 sm:w-72 bg-black/95 
                      border-l border-[#FF9913]/30 shadow-xl p-4 sm:p-5 
                      z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside panel
          >
            {/* --- Header --- */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-Kanit text-white">
                Select parameters
              </h3>
              <button
                onClick={() => setShowMetrics(false)}
                className="text-gray-400 hover:text-[#FF9913]"
              >
                ✕
              </button>
            </div>

            {/* --- Scrollable options --- */}
            <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1 sm:pr-2">
              {metricOptions.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 text-xs sm:text-sm 
                            text-white cursor-pointer hover:text-[#FF9913]"
                >
                  <input
                    type="checkbox"
                    checked={metricsSelected.includes(opt.key)}
                    onChange={() => handleMetricChange(opt.key)}
                    className="accent-[#FF9913]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

          {/* --- Chart --- */}
          <div className="p-2 sm:p-3 md:p-2 relative z-10 h-full mt-8 sm:mt-8 md:mt-9">
        <ResponsiveContainer
          width="100%"
          height={window.innerWidth < 768 ? 400 : 460} // 📱 taller graph on mobile
        >
          <LineChart
            data={processedData}
            margin={{
              top: 10,
              right: 10,
              bottom: window.innerWidth < 768 ? 30 : 25, // ⬅️ add space for bottom label
              left: 0,
            }}
          >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#33415540"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#ffffff",
                    fontSize: window.innerWidth < 768 ? 9 : 11,
                    // fontWeight: 500,
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255, 254, 253, 1)" }}
                  padding={{ left: 5, right: 5 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getHours().toString().padStart(2, "0")}:${date
                      .getMinutes()
                      .toString()
                      .padStart(2, "0")}`;
                  }}
                  angle={window.innerWidth < 768 ? -30 : 0}
                  textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                  height={window.innerWidth < 768 ? 40 : 30}
                />
                <YAxis
                  tick={{
                    fill: "#ffffff",
                    fontSize: window.innerWidth < 768 ? 9 : 11,
                    // fontWeight: 500,
                  }}
                  width={window.innerWidth < 768 ? 32 : 50}
                  tickLine={false}
                  axisLine={{ stroke: "#f5f2efff" }}
                  domain={["auto", "auto"]}
                />
                <ReferenceLine
                  y={0}
                  stroke="#f7f2ebff"
                  strokeDasharray="6 3"
                  strokeWidth={1.2}
                />
              <Tooltip
                  itemStyle={{ fontWeight: 500 }}
                  contentStyle={{
                    backgroundColor: "#000000",
                    border: "1px solid #FF9913",
                    borderRadius: "0.75rem",
                    padding: "4px 8px",
                    fontSize: window.innerWidth < 768 ? "10px" : "11px",
                    boxShadow: "0 0 15px #FF991355",
                  }}
                  formatter={(value, name, props) => {
                    const color = props.color || "#f1f5f9";
                    return [
                      <span style={{ color, fontWeight: 600 }}>{value}</span>,
                      name,
                    ];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const { tripkm, lat_long } = payload[0].payload;
                      const date = new Date(label);

                      const formatted =
                        `${date.getFullYear()}:` +
                        `${String(date.getMonth() + 1).padStart(2, "0")}:` +
                        `${String(date.getDate()).padStart(2, "0")} ` +
                        `${String(date.getHours()).padStart(2, "0")}:` +
                        `${String(date.getMinutes()).padStart(2, "0")}:` +
                        `${String(date.getSeconds()).padStart(2, "0")}`;

            
                      if (Array.isArray(lat_long) && lat_long.length === 2) {
                        setHoveredLatLong(`${lat_long[0].toFixed(5)}, ${lat_long[1].toFixed(5)}`);
                      } else {
                        setHoveredLatLong(null);
                      }

                      return (
                        <div>
                          <div>{formatted}</div>
                          <div style={{ color: "#FFD700", fontWeight: "bold" }}>
                            Trip (km): {tripkm ?? "N/A"}
                          </div>

                          {Array.isArray(lat_long) && lat_long.length === 2 && (
                            <a
                              href={`https://www.google.com/maps?q=${lat_long[0]},${lat_long[1]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#00FFCC",
                                fontWeight: "bold",
                                textDecoration: "underline",
                                cursor: "pointer",
                                display: "inline-block",
                                marginTop: "4px",
                              }}
                            >
                              Lat/Long: {lat_long[0].toFixed(5)}, {lat_long[1].toFixed(5)}
                            </a>
                          )}
                        </div>
                      );
                    }
                    return label;
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#ffffff",
                    fontSize: window.innerWidth < 768 ? 9 : 12,
                    fontWeight: 600,
                  }}
                  iconType="circle"
                />
                {metricOptions
                  .filter((opt) => metricsSelected.includes(opt.key))
                  .map((opt) => (
                    <Line
                      key={opt.key}
                      type="monotone"
                      dataKey={opt.key}
                      name={opt.label}
                      stroke={opt.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  ))}

        {processedData?.length > 0 && (
        <text
          x="50%"
          y="100%"   // bottom of chart area
          dy={window.innerWidth < 768 ? -10 : -2} //  // adjust up/down if needed
          textAnchor="middle"
          fill="#f5f1efff"   // 🎨 custom color (orange)
          fontSize={window.innerWidth < 768 ? 11 : 12} // 🔹 font size
          fontFamily="Kanit, sans-serif"  // 🔹 custom font family
          // fontWeight="600"  // 🔹 bold text
        >
          {(() => {
            const startDate = new Date(processedData[0].time);
            const endDate = new Date(processedData[processedData.length - 1].time);
            // 👉 Format as DD-MM-YYYY
            const format = (d) =>
              `${String(d.getDate()).padStart(2, "0")}-${String(
                d.getMonth() + 1
              ).padStart(2, "0")}-${d.getFullYear()}`;

            if (startDate.toDateString() === endDate.toDateString()) {
              return `Data of ${format(startDate)}`;
            } else {
              return `Data from ${format(startDate)} to ${format(endDate)}`;
            }
          })()}
        </text>
      )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        
        </div>
      </div>


            {/* --- AH Values (40%) --- */}
      <div className="md:col-span-2 w-full h-auto md:h-[530px]">
        {/* 🔹 Big container */}
        <div
        className="bg-gradient-to-br from-[#1e293b] to-[#0f172a]  
                  rounded-2xl shadow-md
                  hover:border-orange-500 hover:shadow-orange-500/20 transition 
                  shadow-lg w-full h-full flex flex-col p-4 
                  border border-white/10"
      >

          {/* 🔹 AH Values + BMS Mosfet in one container */}
          <div className="flex flex-col flex-1 gap-5">
            
            
            {/* --- AH Values Section --- */}

          <div className="flex flex-col flex-1 bg-[#111] rounded-2xl p-3 shadow-md relative">
        {/* Top-left small AH card */}
        <div className="absolute top-1 right-1 bg-black rounded-xl px-1 py-1 border border-gray-800 
                        shadow-md flex flex-col items-center justify-center">
          <p className="text-[10px] text-gray-400 tracking-wider">Remaining capacity(Ah)</p>
          <span className="text-sm font-Kanit text-orange-400">
            {latestGauges?.remainingcapacity_ah ?? "N/A"} 
          </span>
        </div>
        {/* Main AH bars */}
        <h4 className="text-white text-sm font-Kanit mb-3 mt-6">AH values</h4>
        <div className="flex justify-around items-end h-40 gap-6">
          {(() => {
            const latest = livedata?.[livedata.length - 1] || {};
            const bars = [
              { label: "In ah", value: latest.inah || 0, color: "from-green-600 to-green-400", text: "text-green-400 text-bold"  },
              { label: "In ah by charger", value: latest.inah_by_charger || 0, color: "from-yellow-500 to-yellow-300", text: "text-yellow-300" },
              { label: "In ah by regen", value: latest.inah_by_regen || 0, color: "from-blue-500 to-blue-400", text: "text-blue-400" },
              { label: "Out ah", value: latest.outah || 0, color: "from-red-600 to-red-500", text: "text-red-400" },
            ];

            const maxValue = 100;

            return bars.map((b, i) => (
              <div key={i} className="flex flex-col items-center justify-end h-full w-16">
                <span className={`mb-1 text-xs font-medium ${b.text}`}>
                  {Number(b.value).toFixed(2)}
                </span>
                <div className="h-28 w-full bg-black rounded flex items-end overflow-hidden">
                  <div
                    className={`w-full bg-gradient-to-t ${b.color} transition-all duration-500`}
                    style={{ height: `${Math.min((b.value / maxValue) * 100, 100)}%` }}
                  />
                </div>
              <span className="mt-2 text-[12px] sm:text-[12px] md:text-[14px] text-gray-400 text-center whitespace-nowrap">
                  {b.label}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>


            {/* --- BMS Mosfet States Section --- */}
      <div className="flex-1 rounded-2xl p-3 shadow-md border-white/5">
        <h4 className="text-white text-sm font-Kanit mb-3">BMS mosfet state</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {(() => {
            const flags = (details?.bmsmosstates ?? "")
              .split(",")
              .map((v) => parseInt(v.trim(), 10));

            const states = [
              { label: "Main charge mosfet", value: flags[0], icon: BatteryCharging },
              { label: "Main discharge mosfet", value: flags[1], icon: Battery },
              { label: "APU charge mosfet", value: flags[2], icon: BatteryCharging },
              { label: "APU discharge mosfet", value: flags[3], icon: Battery },
            ];

            return states.map((s, i) => {
              const Icon = s.icon;
              const isOn = Boolean(s.value);

              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center space-y-2 
                            p-3 md:p-3 rounded-2xl bg-black shadow-md 
                            transition-all h-38 md:h-48"
                >
                  {/* Icon */}
                  <div
                    className={`p-3 md:p-4 rounded-full relative ${
                      isOn ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    <Icon size={23} />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-t from-white/20 to-transparent opacity-40 pointer-events-none"></span>
                  </div>

                  {/* Label */}
                  <span className="text-[11px] md:text-sm font-medium text-white/80 text-center">
                    {s.label}
                  </span>

                  {/* Status pill */}
                  <span
                    className={`relative px-4 py-1 text-xs md:text-sm font-Kanit rounded-full border overflow-hidden ${
                      isOn
                        ? "bg-gradient-to-r from-emerald-600/40 via-emerald-400/20 to-emerald-600/40 text-emerald-300 border-emerald-500/40"
                        : "bg-gradient-to-r from-red-600/40 via-red-400/20 to-red-600/40 text-red-300 border-red-500/40"
                    }`}
                  >
                    {isOn ? "ON" : "OFF"}
                    <span className="absolute inset-0 bg-gradient-to-t from-white/15 to-transparent opacity-60 pointer-events-none"></span>
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </div>

          </div>
        </div>
      </div>
      </div>



      {/* 🔹 Dashboard Grid with 3 Cards  tierpressuer, ntc_tempretuer tempretuer*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch mt-5">
        {/* 1️⃣ Scooter Status (make wider, span 2 columns) */}
      <div
        className="relative rounded-2xl p-3 
      bg-gradient-to-br from-black via-neutral-950 to-neutral-900
                    border border-white/10 
                  text-white shadow-lg 
                  transition-colors duration-300 hover:border-orange-500
                  lg:col-span-2"
      >
        <SectionTitle left="Tire pressure" className="mb-2" />
        {(() => {
          // 🔹 New status logic
          const checkStatus = (pressure) => {
            if (pressure == null) return { label: "Not found", color: "text-gray-400" };
            if (pressure < 25) return { label: "CRITICAL", color: "text-red-500" };
            if (pressure <= 38) return { label: "IDEAL", color: "text-green-500" };
            return { label: "HIGH", color: "text-red-500" };
          };

          const frontStatus = checkStatus(data1?.front?.pressure);
          const rearStatus = checkStatus(data1?.rear?.pressure);

          const getScooterImage = (front, rear) => {
          const NEUTRAL =
            "https://image2url.com/images/1758954856363-9a9268e8-c363-44c0-9170-420d1bf540dc.png";

          const BOTH_CRITICAL =
            "https://image2url.com/images/1758778399341-c5621768-6e2c-4024-81a0-6eb24045e51f.png";

          const FRONT_CRITICAL =
            "https://image2url.com/images/1758778590597-8c9da437-ba91-4d9c-b495-7ca487da7fa7.png";

          const REAR_CRITICAL =
            "https://image2url.com/images/1758778023587-e084f7b7-e49b-4c86-9483-a4122c69031e.png";

          // 🟦 both missing
          if (front.label === "Not found" && rear.label === "Not found") {
            return NEUTRAL;
          }

          // 🔴 only rear critical (R2125)
          if (front.label === "Not found" && rear.label === "CRITICAL") {
            return REAR_CRITICAL;
          }

          // 🔴 only front critical (F2120)
          if (rear.label === "Not found" && front.label === "CRITICAL") {
            return FRONT_CRITICAL;
          }

          // 🔴🔴 both critical
          if (front.label === "CRITICAL" && rear.label === "CRITICAL") {
            return BOTH_CRITICAL;
          }

          // 🔴🟢 front critical, rear ideal
          if (front.label === "CRITICAL" && rear.label === "IDEAL") {
            return FRONT_CRITICAL;
          }

          // 🟢🔴 front ideal, rear critical
          if (front.label === "IDEAL" && rear.label === "CRITICAL") {
            return REAR_CRITICAL;
          }

          // 🟢🟢 both ideal
          return NEUTRAL;
        };



          const scooterImage = getScooterImage(frontStatus, rearStatus);
          
          return (
            <div className="relative flex justify-center items-center">
              {/* 🔹 Dynamic Scooter */}
              <img
                src={scooterImage}
                alt="Scooter"
                className="w-[80%] max-w-[220px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[360px] xl:max-w-[420px] h-auto object-contain"
              />

              {/* Rear Tire Info */}
              <div className="absolute left-3 sm:left-6 bottom-[45%] flex flex-col text-center">
                <p className="text-sm sm:text-[14px] md:text-sm text-gray-300">Rear</p>
                <p className={`font-Kanit text-sm sm:text-[13px] md:text-sm font-bold ${rearStatus.color}`}>
                  {rearStatus.label}
                </p>
                <div className="bg-black/70 rounded-lg px-2 py-1 mt-1 text-[11px] sm:text-xs md:text-sm text-white min-w-[60px]">
                  <p>{data1?.rear?.pressure ?? "--"} psi</p>      
                  <p>{data1?.rear?.temp ?? "--"}°C</p>
                </div>
              </div>

              {/* Front Tire Info */}
              <div className="absolute right-3 sm:right-6 bottom-[45%] flex flex-col text-center">
                <p className="text-sm sm:text-[18px] md:text-sm text-gray-300">Front</p>
                <p className={`font-Kanit text-sm sm:text-[13px] md:text-sm font-bold ${frontStatus.color}`}>
                  {frontStatus.label}
                </p>
                <div className="bg-black/70 rounded-lg px-2 py-1 mt-1 text-[11px] sm:text-xs md:text-sm text-white min-w-[60px]">
                  <p>{data1?.front?.pressure ?? "--"} psi</p>
                  <p>{data1?.front?.temp ?? "--"}°C</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>


        {/* 2️⃣ Temperatures */}
      <div
        className="relative rounded-2xl p-4 
      bg-gradient-to-br from-black via-neutral-950 to-neutral-900
                  border border-white/10 text-white shadow-lg 
                  transition-all duration-500 hover:border-orange-500/40
                  flex flex-col h-full"
      >
        <SectionTitle left="Temperatures" />

        <div className="grid grid-cols-3 gap-3 mt-2 flex-1">
          {[
            { label: "Ctrl MOS temp", value: latestGauges?.controllermostemp },
            { label: "Motor temp", value: latestGauges?.motortemp },
            { label: "BMS MOS temp", value: latestGauges?.bmsmostemp },
          ].map((t) => (
            <div key={t.label} className="flex justify-center items-center h-full">
              <ThermometerCard
                label={t.label}
                value={Number(t.value) || 0}
                min={0}
                max={120}
                gradient={["#32ed0d", "#e71414"]}
                className="h-full w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative rounded-2xl p-6 
                  bg-gradient-to-br from-black via-neutral-950 to-neutral-900
                  border border-white/10 text-white shadow-lg 
                  transition-all duration-500 hover:border-orange-500/40 
                  flex flex-col h-full"
      >
        <SectionTitle left="Battery pack temperatures" />

        <div className="flex-1 flex flex-col mt-4">
          {(() => {
            // ✅ Extract only NTC values from the long string
            let raw = "";
            if (typeof ntcData?.ntc === "string") {
              const match = ntcData.ntc.match(/ntc=([^ ]+)/i); // everything after "ntc=" till next space
              if (match && match[1]) {
                raw = match[1]; // e.g. "27,27,27,27,-40,-40,-40,-40"
              }
            }

            const arr = raw.split(",").map((v) => Number(v.trim()));

            if (arr.length < 8) {
              return (
                <p className="mt-6 text-base text-center text-white/70">N/A</p>
              );
            }

            const main = arr.slice(0, 4);
            const apu = arr.slice(-4);
            const apuAbsent = apu.every((v) => v === -40);

            // 🔹 Choose NTC labels based on model
            const modelRaw = details?.model ?? "";
            const normalized = modelRaw.toLowerCase().trim().replace(/\s+/g, " ");

            const proAliases = ["nx100pro", "nx 100 pro", "NX 100 PRO"];
            const maxAliases = ["nx100max", "nx 100 max", "NX 100 MAX"];
            const classicAliases = ["nx100classic", "nx 100 classic", "NX 100 CLASSIC"];

            let mainLabels = [];

            if (
              proAliases.includes(normalized.replace(/\s/g, "")) ||
              proAliases.includes(normalized)
            ) {
              mainLabels = [
                "Positive terminal",
                "Cell no 20",
                "Cell no 28",
                "Negative terminal",
              ];
            } else if (
              maxAliases.includes(normalized.replace(/\s/g, "")) ||
              maxAliases.includes(normalized)
            ) {
              mainLabels = [
                "Positive terminal",
                "Cell no 20",
                "Cell no 50",
                "Negative terminal",
              ];
            } else if (
              classicAliases.includes(normalized.replace(/\s/g, "")) ||
              classicAliases.includes(normalized)
            ) {
              mainLabels = [
                "Positive terminal",
                "Cell no 07",
                "Cell no 16",
                "Negative terminal",
              ];
            } else {
              mainLabels = ["NTC1", "NTC2", "NTC3", "NTC4"]; // fallback
            }

            // helper for value color
            const getTempColor = (val) => {
              if (val <= 0) return "text-orange-300";
              if (val < 40) return "text-orange-400";
              if (val < 55) return "text-orange-500";
              return "text-red-500";
            };

            // NTC renderer
            const renderNTCs = (list, customLabels = []) => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {list.map((val, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-black/40 backdrop-blur-md 
                              border border-white/10 
                              p-2 flex flex-col items-center shadow-md 
                              hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(255,140,66,0.4)] 
                              transition"
                  >
                    <span className="text-[11px] text-gray-400 mb-1 text-center">
                      {customLabels[i] || `NTC ${i + 1}`}
                    </span>
                    <span className={`text-lg font-Kanit ${getTempColor(val)}`}>
                      {val}°C
                    </span>
                  </div>
                ))}
              </div>
            );

            return (
              <div className="grid grid-cols-1 gap-5">
                {/* Main Battery */}
                <div className="rounded-xl bg-black/40 border border-white/10 p-2 shadow-lg">
                  <p className="text-sm text-orange-400 font-Kanit mb-3 text-center tracking-wide">
                    Main battery
                  </p>
                  {renderNTCs(main, mainLabels)}
                </div>

                {/* APU */}
                <div className="rounded-xl bg-black/40 border border-white/10 p-2 shadow-lg">
                  <p className="text-sm text-orange-500 font-Kanit mb-3 text-center tracking-wide">
                    APU
                  </p>
                  {apuAbsent ? (
                    <p className="text-sm text-red-500 font-medium text-center">
                      APU not installed
                    </p>
                  ) : (
                    renderNTCs(apu, mainLabels)
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      </div>

    
<div className="batter-card">
  <TelemetryDashboardCell
  ntc={latestNtc}
  minCell={minCellNumber}
  maxCell={maxCellNumber}
  telemetry={livedatafor}
/>


</div>

      <div className="mt-6 ">  
      <Svg>
        <div className="mt-3">
            <h2 className="text-[18px]  font-Kanit tracking-wider text-[#FF9913] mb-3 border-b border-[#FF9913]/30 pb-1">
              Select data and time to view data: <span className="text-white">{vin}</span>
            </h2>

            <div className="flex flex-col gap-2 md:flex-row">
              {/* Start Date */}
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white" />
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full rounded-xl border border-[#FF9913]/30 bg-black pl-10 pr-3 py-2 text-sm text-white outline-none
                            hover:border-[#FF9913]/60 focus:border-[#FF9913]/90 focus:shadow-[0_0_12px_2px_rgba(255,153,19,0.4)] transition"
                />
              </div>
              {/* End Date */}
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white" />
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => handleEndChange(e.target.value)}
                  className="w-full rounded-xl border border-[#FF9913]/30 bg-black pl-10 pr-3 py-2 text-sm text-white outline-none
                            hover:border-[#FF9913]/60 focus:border-[#FF9913]/90 focus:shadow-[0_0_12px_2px_rgba(255,153,19,0.4)] transition"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-3">
              <button
          onClick={fetchHistoricalData}
          disabled={loading}
          className={
            `relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-Kanit text-black shadow-lg transition-all duration-300 ease-in-out ` +
            (loading
              ? "opacity-50 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(245,166,35,0.6)]"
            )
          }
        >
          {/* Glossy shine overlay */}
          <span className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-30"></span>
          <span className="relative z-10">{loading ? "Loading..." : "Load history"}</span>
        </button>

              {!autoMode && (
          <button
            onClick={resetToAuto}
            className="relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-Kanit 
                      text-black shadow-lg transition-all duration-300 ease-in-out
                      bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500
                      hover:scale-105 hover:shadow-[0_0_20px_rgba(245,166,35,0.6)]"
          >
            {/* Glossy shine overlay */}
            <span className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-30"></span>
            <span className="relative z-10">Set default time</span>
          </button>
        )}
            </div>
            
          </div>
              </Svg>

      </div>

        <div className="mt-3">     
              {showHistoryChart && historyData.length > 0 && (
                <div
                  className="relative mt-3 h-[500px] rounded-3xl bg-black
                                border border-[#FF9913]/30 shadow-[0_0_25px_rgba(255,153,19,0.3)]
                                backdrop-blur-xl overflow-hidden"
                >
                  {/* --- Glow Background --- */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#FF991322,transparent_60%),
                                                      radial-gradient(circle_at_bottom_right,#FF991322,transparent_60%)] animate-pulse"></div>
                  {/* --- 📱 Mobile: Dropdown --- */}
                  <div className="md:hidden p-3 relative z-20 ">
                    <div
                      onClick={() => setShowMetrics1(!showMetrics1)}
                      className="w-full flex items-center justify-between px-3 py-2 
                                bg-black text-white rounded-lg shadow-md 
                                border border-[#FF9913]/30 text-sm font-medium cursor-pointer"
                    >
                      Select parameters to be shown on graph.
                      <span>{showMetrics1 ? "▲" : "▼"}</span>
                    </div>

                    {showMetrics1 && (
                      <div className="mt-2 bg-black border border-[#FF9913]/30 
                                      rounded-xl p-3 space-y-2 shadow-lg max-h-60 overflow-y-auto">
                        {metricOptions1.map((opt) => (
                          <label
                            key={opt.key}
                            className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#FF9913] transition"
                          >
                            <input
                              type="checkbox"
                              checked={metricsSelected1.includes(opt.key)}
                              onChange={() => handleMetricChange1(opt.key)}
                              className="accent-[#FF9913]"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* --- Main Layout --- */}
                  <div className="grid md:grid-cols-[1fr_220px] h-full relative z-10">
                    {/* --- Chart --- */}
                    <div className="p-4 mt-6 md:mt-0">
                      <ResponsiveContainer
                        width="100%"
                        height={window.innerWidth < 768 ? 360 : 420}
                      >
                        <LineChart
                          data={processedData1}
                          margin={{
                            top: 10,
                            right: 10,
                            bottom: window.innerWidth < 768 ? 50 : 20,
                            left: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#33415540"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="time"
                            tick={{
                              fill: "#ffffff",
                              fontSize: window.innerWidth < 768 ? 9 : 11,
                              fontWeight: 500,
                            }}
                            tickLine={false}
                            axisLine={{ stroke: "#fffbf7ff" }}
                            padding={{ left: 5, right: 5 }}
                            interval="preserveStartEnd"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date
                                .getHours()
                                .toString()
                                .padStart(2, "0")}:${date
                                .getMinutes()
                                .toString()
                                .padStart(2, "0")}`;
                            }}
                            angle={window.innerWidth < 768 ? -30 : 0}
                            textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                            height={window.innerWidth < 768 ? 45 : 30}
                          />
                          <YAxis
                            tick={{
                              fill: "#ffffff",
                              fontSize: window.innerWidth < 768 ? 9 : 11,
                              fontWeight: 500,
                            }}
                            width={window.innerWidth < 768 ? 35 : 50}
                            tickLine={false}
                            axisLine={{ stroke: "#fcfffcff" }}
                            domain={["auto", "auto"]}
                          />

                          <ReferenceLine
                            y={0}
                            stroke="#ffffffff"
                            strokeDasharray="6 3"
                            strokeWidth={1.2}
                          />

                                    <Tooltip
        itemStyle={{ fontWeight: 500 }}
        contentStyle={{
          backgroundColor: "#000000",
          border: "1px solid #FF9913",
          borderRadius: "0.75rem",
          padding: "4px 8px",
          fontSize: window.innerWidth < 768 ? "10px" : "11px",
          boxShadow: "0 0 15px #FF991355",
        }}
        formatter={(value, name, props) => {
          const color = props.color || "#f1f5f9";
          return [
            <span style={{ color, fontWeight: 600 }}>{value}</span>,
            name,
          ];
        }}
        labelFormatter={(label, payload) => {
          if (payload && payload.length > 0) {
            const { tripkm, lat_long } = payload[0].payload;
            const date = new Date(label);

            const formatted =
              `${date.getFullYear()}:` +
              `${String(date.getMonth() + 1).padStart(2, "0")}:` +
              `${String(date.getDate()).padStart(2, "0")} ` +
              `${String(date.getHours()).padStart(2, "0")}:` +
              `${String(date.getMinutes()).padStart(2, "0")}:` +
              `${String(date.getSeconds()).padStart(2, "0")}`;

            // 👉 Save the hovered lat/long (for Ctrl+C copy)
            if (Array.isArray(lat_long) && lat_long.length === 2) {
              setHoveredLatLong(`${lat_long[0].toFixed(5)}, ${lat_long[1].toFixed(5)}`);
            } else {
              setHoveredLatLong(null);
            }

            return (
              <div>
                <div>{formatted}</div>
                <div style={{ color: "#FFD700", fontWeight: "bold" }}>
                  Trip (km): {tripkm ?? "N/A"}
                </div>

                {Array.isArray(lat_long) && lat_long.length === 2 && (
                  <a
                    href={`https://www.google.com/maps?q=${lat_long[0]},${lat_long[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#00FFCC",
                      fontWeight: "bold",
                      textDecoration: "underline",
                      cursor: "pointer",
                      display: "inline-block",
                      marginTop: "4px",
                    }}
                  >
                    Lat/Long: {lat_long[0].toFixed(5)}, {lat_long[1].toFixed(5)}
                  </a>
                )}
              </div>
            );
          }
          return label;
        }}
      />
                          <Legend
                            wrapperStyle={{
                              color: "#ffffff",
                              fontSize: window.innerWidth < 768 ? 10 : 12,
                              fontWeight: 600,
                            }}
                            iconType="circle"
                          />

                          {/* --- Dynamic Lines --- */}
                          {metricOptions1
                            .filter((opt) => metricsSelected1.includes(opt.key))
                            .map((opt) => (
                              <Line
                                key={opt.key}
                                type="monotone"
                                dataKey={opt.key}
                                name={opt.label}
                                stroke={opt.color}
                                strokeWidth={1.8}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls
                              />
                            ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* --- 💻 Desktop: Sidebar --- */}
                <div className="hidden md:flex border-l border-[#FF9913]/20 bg-black backdrop-blur-md p-4 flex-col h-[500px]">
              <h3 className="text-sm font-Kanit text-white mb-4 tracking-wide border-b border-[#FF9913]/30 pb-1">
                Select parameters to be shown on graph.
              </h3>
                <div className="flex flex-col gap-2 overflow-y-auto pr-2">
                        {metricOptions1.map((opt) => (
                          <label
                            key={opt.key}
                            className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#FF9913] transition"
                          >
                            <input
                              type="checkbox"
                              checked={metricsSelected1.includes(opt.key)}
                              onChange={() => handleMetricChange1(opt.key)}
                              className="accent-[#FF9913]"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* --- Close Button --- */}
                  <button
                    onClick={() => setShowHistoryChart(false)}
                    className="absolute bottom-6 right-8 z-20 px-5 py-2
                              bg-[#F61111] hover:bg-[#FF4500] 
                              text-white text-sm font-Kanit 
                              rounded-lg shadow-md border border-[#F61111]
                              backdrop-blur-sm
                              transition-all duration-300 ease-in-out
                              hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              )}
        </div>
        </>
        )}

        {activePage === "graph" && (
          <>
          <div>
          <div
            className="relative mt-3 h-[500px] rounded-3xl bg-black
                        border border-[#FF9913]/30 shadow-[0_0_25px_rgba(255,153,19,0.3)]
                        backdrop-blur-xl overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#FF991322,transparent_60%),
                                            radial-gradient(circle_at_bottom_right,#FF991322,transparent_60%)] 
                                            animate-pulse"></div>
              <div className="md:hidden p-3 relative z-10">
              <div
                          onClick={() => setShowMetrics1(!showMetrics1)}
                          className="w-full flex items-center justify-between px-3 py-2 
                                    bg-black text-white rounded-lg shadow-md 
                                    border border-[#FF9913]/30 text-sm font-medium cursor-pointer"
                        >
                          Select parameters to be shown on graph.
                          <span>{showMetrics1 ? "▲" : "▼"}</span>
                        </div>
          
                        {showMetrics1 && (
                          <div className="mt-2 bg-black border border-[#FF9913]/30 
                                          rounded-xl p-2 space-y-2 shadow-lg max-h-60 overflow-y-auto">
                  {metricOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#FF9913] transition"
                    >
                      <input
                        type="checkbox"
                        checked={metricsSelected.includes(opt.key)}
                        onChange={() => handleMetricChange(opt.key)}
                        className="accent-[#FF9913]"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          
            <div className="grid md:grid-cols-[1fr_220px] h-full relative z-10">
              {/* --- Chart --- */}
              <div className="p-4">
                <ResponsiveContainer
                  width="100%"
                  height={window.innerWidth < 768 ? 360 : 450}
                >
                  <LineChart
                    data={processedData}
                    margin={{
                      top: 10,
                      right: 10,
                      bottom: window.innerWidth < 768 ? 50 : 20,
                      left: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#33415540" vertical={false} />
                    
                    <XAxis
                      dataKey="time"
                      tick={{
                        fill: "#ffffff",
                        fontSize: window.innerWidth < 768 ? 9 : 11,
                        fontWeight: 500,
                      }}
                      tickLine={false}
                      axisLine={{ stroke: "#FF9913" }}
                      padding={{ left: 5, right: 5 }}
                      interval="preserveStartEnd"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getHours().toString().padStart(2, "0")}:${date
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}`;
                      }}
                      angle={window.innerWidth < 768 ? -30 : 0}
                      textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                      height={window.innerWidth < 768 ? 45 : 30}
                    />
          
                    <YAxis
                      tick={{
                        fill: "#ffffff",
                        fontSize: window.innerWidth < 768 ? 9 : 11,
                        fontWeight: 500,
                      }}
                      width={window.innerWidth < 768 ? 35 : 50}
                      tickLine={false}
                      axisLine={{ stroke: "#FF9913" }}
                      domain={["auto", "auto"]}
                    />
                    
                    <ReferenceLine y={0} stroke="#FF9913" strokeDasharray="6 3" strokeWidth={1.2} />
          
                        <Tooltip
                        itemStyle={{ fontWeight: 500 }}
                        contentStyle={{
                          backgroundColor: "#000000",
                          border: "1px solid #FF9913",
                          borderRadius: "0.75rem",
                          padding: "4px 8px",
                          fontSize: window.innerWidth < 768 ? "10px" : "11px",
                          boxShadow: "0 0 15px #FF991355",
                        }}
                        formatter={(value, name, props) => {
                          const color = props.color || "#f1f5f9";
                          return [
                            <span style={{ color, fontWeight: 600 }}>{value}</span>,
                            name,
                          ];
                        }}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            const { tripkm, lat_long } = payload[0].payload;
                            const date = new Date(label);

                            const formatted =
                              `${date.getFullYear()}:` +
                              `${String(date.getMonth() + 1).padStart(2, "0")}:` +
                              `${String(date.getDate()).padStart(2, "0")} ` +
                              `${String(date.getHours()).padStart(2, "0")}:` +
                              `${String(date.getMinutes()).padStart(2, "0")}:` +
                              `${String(date.getSeconds()).padStart(2, "0")}`;

                            // 👉 Save the hovered lat/long (for Ctrl+C copy)
                            if (Array.isArray(lat_long) && lat_long.length === 2) {
                              setHoveredLatLong(`${lat_long[0].toFixed(5)}, ${lat_long[1].toFixed(5)}`);
                            } else {
                              setHoveredLatLong(null);
                            }

                            return (
                              <div>
                                <div>{formatted}</div>
                                <div style={{ color: "#FFD700", fontWeight: "bold" }}>
                                  Trip (km): {tripkm ?? "N/A"}
                                </div>

                                {Array.isArray(lat_long) && lat_long.length === 2 && (
                                  <a
                                    href={`https://www.google.com/maps?q=${lat_long[0]},${lat_long[1]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "#00FFCC",
                                      fontWeight: "bold",
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                      display: "inline-block",
                                      marginTop: "4px",
                                    }}
                                  >
                                    Lat/Long: {lat_long[0].toFixed(5)}, {lat_long[1].toFixed(5)}
                                  </a>
                                )}
                              </div>
                            );
                          }
                          return label;
                        }}
                      />

                    <Legend
                      wrapperStyle={{
                        color: "#ffffff",
                        fontSize: window.innerWidth < 768 ? 10 : 12,
                        fontWeight: 600,
                      }}
                      iconType="circle"
                    />
          
                    {metricOptions
                      .filter((opt) => metricsSelected.includes(opt.key))
                      .map((opt) => {
                        if (opt.key === "currentconsumption") {
                          return (
                            <React.Fragment key="currentconsumption">
                              <Line type="monotone" dataKey="currentPositive" name="Current + (A)"
                                stroke="#13ff23ff" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                              <Line type="monotone" dataKey="currentNegative" name="Current - (A)"
                                stroke="#ff0000ff" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                            </React.Fragment>
                          );
                        }
                        return (
                          <Line key={opt.key} type="monotone" dataKey={opt.key} name={opt.label}
                            stroke={opt.color} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                        );
                      })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
          
              {/* --- 💻 Desktop: Side Metrics Card --- */}
              <div className="hidden md:flex border-l border-[#FF9913]/20 bg-black backdrop-blur-md p-4 flex-col h-[500px]">
            <h3 className="text-sm font-Kanit text-white mb-4 tracking-wide border-b border-[#FF9913]/30 pb-1">
              Select parameters to be shown on graph.
            </h3>
          
              <div className="flex flex-col gap-2 overflow-y-auto pr-2">
                  {metricOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#FF9913] transition"
                    >
                      <input
                        type="checkbox"
                        checked={metricsSelected.includes(opt.key)}
                        onChange={() => handleMetricChange(opt.key)}
                        className="accent-[#FF9913]"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>



        <div className="mt-3">

              <Svg>
          <div className="mt-3">
            <h2 className="text-base font-Kanit tracking-wider text-[#FF9913] mb-3 border-b border-[#FF9913]/30 pb-1">
              Select data and time to view data: <span className="text-white">{vin}</span>
            </h2>

            <div className="flex flex-col gap-2 md:flex-row">
              {/* Start Date */}
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white" />
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full rounded-xl border border-[#FF9913]/30 bg-black pl-10 pr-3 py-2 text-sm text-white outline-none
                            hover:border-[#FF9913]/60 focus:border-[#FF9913]/90 focus:shadow-[0_0_12px_2px_rgba(255,153,19,0.4)] transition"
                />
              </div>

              {/* End Date */}
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white" />
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => handleEndChange(e.target.value)}
                  className="w-full rounded-xl border border-[#FF9913]/30 bg-black pl-10 pr-3 py-2 text-sm text-white outline-none
                            hover:border-[#FF9913]/60 focus:border-[#FF9913]/90 focus:shadow-[0_0_12px_2px_rgba(255,153,19,0.4)] transition"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-3">
              <button
          onClick={fetchHistoricalData}
          disabled={loading}
          className={
            `relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-Kanit text-black shadow-lg transition-all duration-300 ease-in-out ` +
            (loading
              ? "opacity-50 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(245,166,35,0.6)]"
            )
          }
        >
          {/* Glossy shine overlay */}
          <span className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-30"></span>
          <span className="relative z-10">{loading ? "Loading..." : "Load history"}</span>
        </button>
              {!autoMode && (
          <button
            onClick={resetToAuto}
            className="relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-Kanit 
                      text-black shadow-lg transition-all duration-300 ease-in-out
                      bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500
                      hover:scale-105 hover:shadow-[0_0_20px_rgba(245,166,35,0.6)]"
          >
            {/* Glossy shine overlay */}
            <span className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-30"></span>
            <span className="relative z-10">Set default time</span>
          </button>
              )}
            </div>
          </div>
          </Svg>
              {showHistoryChart && historyData.length > 0 && (
                <div
                  className="relative mt-3 h-[500px] rounded-3xl bg-black
                                border border-[#FF9913]/30 shadow-[0_0_25px_rgba(255,153,19,0.3)]
                                backdrop-blur-xl overflow-hidden"
                >
                  {/* --- Glow Background --- */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#FF991322,transparent_60%),
                                                      radial-gradient(circle_at_bottom_right,#FF991322,transparent_60%)] animate-pulse"></div>
                  {/* --- 📱 Mobile: Dropdown --- */}
                  <div className="md:hidden p-3 relative z-20">
                    <div
                      onClick={() => setShowMetrics1(!showMetrics1)}
                      className="w-full flex items-center justify-between px-3 py-2 
                                bg-black text-white rounded-lg shadow-md 
                                border border-[#FF9913]/30 text-sm font-medium cursor-pointer"
                    >
                      Select parameters to be shown on graph.
                      <span>{showMetrics1 ? "▲" : "▼"}</span>
                    </div>

                    {showMetrics1 && (
                      <div className="mt-2 bg-black border border-[#FF9913]/30 
                                      rounded-xl p-3 space-y-2 shadow-lg max-h-60 overflow-y-auto overflow-y-auto">
                        {metricOptions1.map((opt) => (
                          <label
                            key={opt.key}
                            className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#FF9913] transition"
                          >
                            <input
                              type="checkbox"
                              checked={metricsSelected1.includes(opt.key)}
                              onChange={() => handleMetricChange1(opt.key)}
                              className="accent-[#FF9913]"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* --- Main Layout --- */}
                  <div className="grid md:grid-cols-[1fr_220px] h-full relative z-10">
                    {/* --- Chart --- */}
                    <div className="p-4 mt-6 md:mt-0">
                      <ResponsiveContainer
                        width="100%"
                        height={window.innerWidth < 768 ? 360 : 420}
                      >
                        <LineChart
                          data={processedData1}
                          margin={{
                            top: 10,
                            right: 10,
                            bottom: window.innerWidth < 768 ? 50 : 20,
                            left: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#33415540"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="time"
                            tick={{
                              fill: "#ffffff",
                              fontSize: window.innerWidth < 768 ? 9 : 11,
                              fontWeight: 500,
                            }}
                            tickLine={false}
                            axisLine={{ stroke: "#fffbf7ff" }}
                            padding={{ left: 5, right: 5 }}
                            interval="preserveStartEnd"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date
                                .getHours()
                                .toString()
                                .padStart(2, "0")}:${date
                                .getMinutes()
                                .toString()
                                .padStart(2, "0")}`;
                            }}
                            angle={window.innerWidth < 768 ? -30 : 0}
                            textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                            height={window.innerWidth < 768 ? 45 : 30}
                          />
                          <YAxis
                            tick={{
                              fill: "#ffffff",
                              fontSize: window.innerWidth < 768 ? 9 : 11,
                              fontWeight: 500,
                            }}
                            width={window.innerWidth < 768 ? 35 : 50}
                            tickLine={false}
                            axisLine={{ stroke: "#fcfffcff" }}
                            domain={["auto", "auto"]}
                          />

                          <ReferenceLine
                            y={0}
                            stroke="#ffffffff"
                          strokeDasharray="6 3"
                          strokeWidth={1.2}
                        />

                          <Tooltip
                          itemStyle={{ fontWeight: 500 }}
                          contentStyle={{
                            backgroundColor: "#000000",
                            border: "1px solid #FF9913",
                            borderRadius: "0.75rem",
                            padding: "4px 8px",
                            fontSize: window.innerWidth < 768 ? "10px" : "11px",
                            boxShadow: "0 0 15px #FF991355",
                          }}
                          formatter={(value, name, props) => {
                            const color = props.color || "#f1f5f9";
                            return [
                              <span style={{ color, fontWeight: 600 }}>{value}</span>,
                              name,
                            ];
                          }}
                          labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                              const { tripkm, lat_long } = payload[0].payload;
                              const date = new Date(label);

                              const formatted =
                                `${date.getFullYear()}:` +
                                `${String(date.getMonth() + 1).padStart(2, "0")}:` +
                                `${String(date.getDate()).padStart(2, "0")} ` +
                                `${String(date.getHours()).padStart(2, "0")}:` +
                                `${String(date.getMinutes()).padStart(2, "0")}:` +
                                `${String(date.getSeconds()).padStart(2, "0")}`;

                              // 👉 Save the hovered lat/long (for Ctrl+C copy)
                              if (Array.isArray(lat_long) && lat_long.length === 2) {
                                setHoveredLatLong(`${lat_long[0].toFixed(5)}, ${lat_long[1].toFixed(5)}`);
                              } else {
                                setHoveredLatLong(null);
                              }

                              return (
                                <div>
                                  <div>{formatted}</div>
                                  <div style={{ color: "#FFD700", fontWeight: "bold" }}>
                                    Trip (km): {tripkm ?? "N/A"}
                                  </div>

                                  {Array.isArray(lat_long) && lat_long.length === 2 && (
                                    <a
                                      href={`https://www.google.com/maps?q=${lat_long[0]},${lat_long[1]}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: "#00FFCC",
                                        fontWeight: "bold",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                        display: "inline-block",
                                        marginTop: "4px",
                                      }}
                                    >
                                      Lat/Long: {lat_long[0].toFixed(5)}, {lat_long[1].toFixed(5)}
                                    </a>
                                  )}
                                </div>
                              );
                            }
                            return label;
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            color: "#ffffff",
                            fontSize: window.innerWidth < 768 ? 10 : 12,
                            fontWeight: 600,
                          }}
                          iconType="circle"
                        />
                        {/* --- Dynamic Lines --- */}
                        {metricOptions1
                          .filter((opt) => metricsSelected1.includes(opt.key))
                          .map((opt) => (
                            <Line
                              key={opt.key}
                              type="monotone"
                              dataKey={opt.key}
                              name={opt.label}
                              stroke={opt.color}
                              strokeWidth={1.8}
                              dot={false}
                              isAnimationActive={false}
                              connectNulls
                            />
                          ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* --- 💻 Desktop: Sidebar --- */}
                  <div className="hidden md:flex border-l border-[#FF9913]/20 bg-black backdrop-blur-md p-4 flex-col h-[500px]">
                <h3 className="text-sm font-Kanit text-white mb-4 tracking-wide border-b border-[#FF9913]/30 pb-1">
                  Select parameters to be shown on graph.
                </h3>
                <div className="flex flex-col gap-2 overflow-y-auto pr-2">
                      {metricOptions1.map((opt) => (
                        <label
                          key={opt.key}
                          className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#FF9913] transition"
                        >
                          <input
                            type="checkbox"
                            checked={metricsSelected1.includes(opt.key)}
                            onChange={() => handleMetricChange1(opt.key)}
                            className="accent-[#FF9913]"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {/* --- Close Button --- */}
                <button
                  onClick={() => setShowHistoryChart(false)}
                  className="absolute bottom-6 right-8 z-20 px-5 py-2
                            bg-[#F61111] hover:bg-[#FF4500] 
                            text-white text-sm font-Kanit 
                            rounded-lg shadow-md border border-[#F61111]
                            backdrop-blur-sm
                            transition-all duration-300 ease-in-out
                            hover:scale-105"
                >
                  Close
                </button>
              </div>
            )}
            </div>
          </div>
      </>
      )}
      {activePage === "world" && (
          <>  
        <Worlelc vin={vin}/>
          </>
      )} 
       {activePage === "table" && (
          <>  
           <Tabledata vin={vin}/> 
          </>
      )}
       {activePage === "tickets" && (
          <>  
         <TicketUi/>
          </>
      )}

      {activePage === "commad" && (
          <>  
         <SendCommand vin={vin} 
         lastUpdated={lastUpdated} 
         location={locationData} 
         ownerName={details?.ownerName || details?.ownername}
         phoneNumber={details?.phoneNumber || details?.phonenumber}/>
          </>
      )}
     

      <footer className="mx-auto  px-4 py-6 text-center text-xs text-white/50">
      VIN: {(latest?.vinnumber || latest?.vinNumber || vin) || "N/A"} •{" "}
      {mode === "realtime" ? "Live" : "History"}
      </footer>
        </main>             
      </div>
      </div>      
      </div>       
    )
    ;}