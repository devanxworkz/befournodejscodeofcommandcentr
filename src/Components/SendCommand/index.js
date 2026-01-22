import { Weight } from "lucide-react";
import { useState, useEffect,useMemo } from "react";

const decToHex2 = (dec) =>
  Number(dec).toString(16).padStart(2, "0").toUpperCase();

const decToHex4 = (dec) =>
  Number(dec).toString(16).padStart(4, "0").toUpperCase();

const swapBytes = (hex) =>
  hex.match(/.{1,2}/g).reverse().join("");

// const decToHex4 = (num) =>
//   Number(num).toString(16).padStart(4, "0").toUpperCase();

// const swapBytes = (hex) =>
//   hex.slice(2, 4) + hex.slice(0, 2);

const currentToHex = (value) => {
  if (!value) return "0000";
  const scaled = Number(value) * 4;
  return swapBytes(decToHex4(scaled));
};


export default function SendCommand({ vin ,lastUpdated,location, ownerName, phoneNumber}) {
  const [mode, setMode] = useState("BASIC"); // BASIC | ADVANCED

 const [form, setForm] = useState({
  vinNumber: vin || "",
  commandType: "",        // POWER, BLUETOOTH, CAN, etc
  canMode: "",            // RAW | SET_RPM
  value: "",
  clientId: "COMMANDCENTER",
  commandType: "",
  lineCurrent: "",
  phaseCurrent: "",
  regenMin: "",
  regenMax: "",
  // RAW CAN
  canId: "",
  canData: "",
  // SET RPM
  rpm: "",
  boostDuration: "",
  boostInterval: "",
  
});

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [moduleType, setModuleType] = useState("CONTROLLER");

  
const validateCommand = () => {
  // ✅ ADVANCED MODE — only CAN validation
  if (mode === "ADVANCED") {
    if (!isValidCanId(form.canId)) {
      setStatus("CAN ID must be 8 HEX chars");
      return false;
    }
    if (!isValidCanData(form.canData)) {
      setStatus("CAN DATA must be 16 HEX chars");
      return false;
    }
    return true;
  }

  // ✅ BASIC MODE
  if (!form.commandType) {
    setStatus("Please select a command");
    return false;
  }

  if (
    (form.commandType === "POWER" ||
      form.commandType === "BLUETOOTH" ||
      form.commandType === "AIRPLANE") &&
    !form.value
  ) {
    setStatus("Please select ON or OFF");
    return false;
  }

  if (form.commandType === "CAN_RAW") {
    if (!isValidCanId(form.canId)) {
      setStatus("CAN ID must be 8 HEX chars");
      return false;
    }
    if (!isValidCanData(form.canData)) {
      setStatus("CAN DATA must be 16 HEX chars");
      return false;
    }
  }

  return true;
};


 useEffect(() => {
  setForm(prev => ({
    ...prev,
    commandType: "",
    canId: "",
    canData: ""
  }));
}, [mode]);


useEffect(() => {
  if (form.commandType !== "CAN_GEAR_CTRL") {
    setForm((prev) => ({
      ...prev,
      gear: "",
    }));
  }
}, [form.commandType]);

useEffect(() => {
  if (form.commandType !== "CAN_CRUISE_CTRL") {
    setForm((prev) => ({
      ...prev,
      cruise: "",
    }));
  }
}, [form.commandType]);


useEffect(() => {
  if (form.commandType !== "CAN_BMS_RATED_CAPACITY") {
    setForm((prev) => ({
      ...prev,
      bmsRatedCapacity: "",
    }));
  }
}, [form.commandType]);

const openConfirmPopup = (e) => {
  if (e) e.preventDefault(); // SAFE for buttons
  if (!validateCommand()) return;
  setShowConfirm(true);
};


const sendCommand = async () => {
  let backendCommandType = "CAN";
  let finalValue = "";

  /* ========= ADVANCED ========= */
  if (mode === "ADVANCED") {
    if (!isValidCanId(form.canId)) {
      setStatus("CAN ID must be 8 HEX chars");
      return;
    }
    if (!isValidCanData(form.canData)) {
      setStatus("CAN DATA must be 16 HEX chars");
      return;
    }

    finalValue = `FFAA5501030015${form.canId}${form.canData}`;
  }

  /* ========= BASIC ========= */
  else {
    backendCommandType = form.commandType;

     if (
    form.commandType === "POWER" ||
    form.commandType === "BLUETOOTH" ||
    form.commandType === "AIRPLANE"
  ) {
    finalValue = form.value;
  }

  if (form.commandType === "CAN_RAW") {
    backendCommandType = "CAN";
    finalValue = `FFAA5501030015${form.canId}${form.canData}`;
  }
                  
if (form.commandType === "CAN_SET_RPM") {
  backendCommandType = "CAN";

  // RPM must come from user
  const rpm = Number(form.rpm);

  // ✅ Defaults
  const duration = form.boostDuration
    ? Number(form.boostDuration)
    : 5;

  const interval = form.boostInterval
    ? Number(form.boostInterval)
    : 30;

  // ✅ Conversions (safe)
  const rpmHex = swapBytes(decToHex4(rpm));
  const durationHex = decToHex2(duration);
  const intervalHex = decToHex2(interval);

  finalValue = `FFAA550103001510FCA807${rpmHex}00000000${durationHex}${intervalHex}`;
}

  if (form.commandType === "CAN_STE_DURATION") {
  backendCommandType = "CAN";

  // ✅ SAFE DEFAULTS
  const rpm = form.rpm ? Number(form.rpm) : 3600;
  const duration = Number(form.boostDuration); // user input expected
  const interval = form.boostInterval ? Number(form.boostInterval) : 30;

  // ✅ CONVERSIONS
  const rpmHex = swapBytes(decToHex4(rpm));
  const durationHex = decToHex2(duration);
  const intervalHex = decToHex2(interval);

  finalValue = `FFAA550103001510FCA807${rpmHex}00000000${durationHex}${intervalHex}`;
}

  if (form.commandType === "CAN_SET_INTRVAL") {
  backendCommandType = "CAN";

  // ✅ SAFE DEFAULTS
  const rpm = form.rpm ? Number(form.rpm) : 3600;
  const duration = form.boostDuration ? Number(form.boostDuration) : 5;
  const interval = Number(form.boostInterval); // required

  // ✅ CONVERSIONS (now always safe)
  const rpmHex = swapBytes(decToHex4(rpm));
  const durationHex = decToHex2(duration);
  const intervalHex = decToHex2(interval);

  finalValue = `FFAA550103001510FCA807${rpmHex}00000000${durationHex}${intervalHex}`;
}

if (form.commandType === "CAN_CURRENT") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 0;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 300;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 30;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 40;

  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);

  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}

if (form.commandType === "CAN_PASH_CURRENT") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 100;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 0;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 30;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 40;

  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);

  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}


if (form.commandType === "CAN_REGEN_MIN") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 100;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 300;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 0;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 40;

  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);

  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}

if (form.commandType === "CAN_REGEN_MAX") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 100;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 300;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 30;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 0;

  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);

  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}

if (form.commandType === "CAN_GEAR_CTRL") {
  backendCommandType = "CAN";

  const HEADER = "FFAA5501030015";
  const CAN_ID = "10F8A807"; 
                  
  const gearMap = {
    NEUTRAL: "040001020E007387",
    FORWARD: "050001020E007387",
    BACKWARD: "060001020E007387",
  };

  if (!form.gear || !gearMap[form.gear]) {
    setStatus("Please select gear mode");
    return;
  }

  finalValue = `${HEADER}${CAN_ID}${gearMap[form.gear]}`;
}

if (form.commandType === "CAN_CRUISE_CTRL") {
  backendCommandType = "CAN";

  const HEADER = "FFAA5501030015";
  const CAN_ID = "10F8A807";

  const cruiseMap = {
    ON: "040001020E007387", 
    OFF: "0400010200007387",
  };

  if (!form.cruise || !cruiseMap[form.cruise]) {
    setStatus("Please select Cruise ON or OFF");
    return;
  }

  finalValue = `${HEADER}${CAN_ID}${cruiseMap[form.cruise]}`;
}

if (form.commandType === "CAN_RATED_CAPACITY") {
  backendCommandType = "CAN";

  if (!form.capacityValue) {
    setStatus("Please enter rated capacity");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16060180";

  // 60 × 1000 = 60000 → EA60
  const decimalValue = Number(form.capacityValue) * 1000;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `0000${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_REMAINING_CAPACITY") {
  backendCommandType = "CAN";

  if (!form.remainingCapacityValue) {
    setStatus("Please enter remaining capacity");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16080180";

  const decimalValue = Number(form.remainingCapacityValue) * 1000;
  let hexValue = decimalValue.toString(16).toUpperCase();
  hexValue = hexValue.padStart(8, "0");

  const CAN_DATA = `${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}
if (form.commandType === "CAN_TOTAL_DISCHARGING_AH") {
  backendCommandType = "CAN";

  if (!form.totalDischargingAh) {
    setStatus("Please enter total discharging Ah");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "160C0180";

  // Step 1: multiply by 1000
  const decimalValue = Number(form.totalDischargingAh) * 1000;

  // Step 2: decimal → hex
  let hexValue = decimalValue.toString(16).toUpperCase();

  // Step 3: LEFT padding → first 4 bytes (8 hex chars)
  hexValue = hexValue.padStart(8, "0");

  // Step 4: value in first 4 bytes, rest zero
  const CAN_DATA = hexValue + "00000000";

  finalValue = HEADER + CAN_ID + CAN_DATA;
}

if (form.commandType === "CAN_BALANCING_CURRENT") {
  backendCommandType = "CAN";

  if (!form.balanceCurrent) {
    setStatus("Please enter balancing current");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16120180";

  // 1A → ×10 → 10 → 0A
  const decimalValue = Number(form.balanceCurrent) * 10;

  const hexValue = Math.round(decimalValue)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0"); // FIRST 2 BYTES ONLY

  const CAN_DATA = `${hexValue}000000000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_CHG_TEMP_HIGH_L2") {
  backendCommandType = "CAN";

  if (!form.tempValue) {
    setStatus("Please enter temperature value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16860180"; // keep same as spec

  // temperature + offset
  const adjustedTemp = Number(form.tempValue) + 40;

  // decimal → hex (1 byte)
  const hexTemp = adjustedTemp
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");

  // FF 02 21 00 XX 00 00 00
  const CAN_DATA = `FF022100${hexTemp}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_DES_TEMP_HIGH_L2") {
  backendCommandType = "CAN";

  if (!form.tempValue) {
    setStatus("Please enter temperature value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16870180"; // keep same as spec
                  
  // temperature + offset
  const adjustedTemp = Number(form.tempValue) + 40;

  // decimal → hex (1 byte)
  const hexTemp = adjustedTemp
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");

  // FF 02 21 00 XX 00 00 00
  const CAN_DATA = `FF022100${hexTemp}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_CHG_OVERCURRENT_L2") {
  backendCommandType = "CAN";

  if (!form.overCurrent) {
    setStatus("Please enter overcurrent value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16840180"; 

  // 90A → 90×10 = 900 → +30000 = 30900
  const decimalValue = 30000 + Number(form.overCurrent) * 10;

  // 30900 → 78B4
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // LEFT → RIGHT placement (NO swap)
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_DISCHG_OVERCURRENT_L2") {
  backendCommandType = "CAN";

  if (!form.overCurrent) {
    setStatus("Please enter discharge overcurrent value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16850180";

  // 90A → 90×10 = 900 → 30000 - 900 = 29100
  const decimalValue = 30000 - Number(form.overCurrent) * 10;

  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_MANUAL_SOC") {
  backendCommandType = "CAN";

  if (!form.manualSoc) {
    setStatus("Please enter SOC value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "161E0180";

  // 90% → 90×10 = 900 → 0x0384
  const decimalValue = Number(form.manualSoc) * 10;

  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0"); // first 2 bytes

  // XX XX 00 00 00 00 00 00
  const CAN_DATA = `${hexValue}000000000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_SOC_LOW_L2") {
  backendCommandType = "CAN";

  if (!form.socValue) {
    setStatus("Please enter SOC value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "168C0180";

  // 7% → 7×10 = 70 → 0x46
  const decimalValue = Number(form.socValue) * 10;

  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0"); // byte-4 & byte-5

  // FF 02 21 00 XX 00 00 00
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_CHG_MOSFET") {
  backendCommandType = "CAN";

  if (!form.mosfetState) {
    setStatus("Please select ON or OFF");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "162A0180";

  const CAN_DATA =
    form.mosfetState === "ON"
      ? "0101020304050607"
      : "0001020304050607";

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}
if (form.commandType === "CAN_DISCHG_MOSFET") {
  backendCommandType = "CAN";

  if (!form.mosfetState) {
    setStatus("Please select ON or OFF");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "162C0180";

  const CAN_DATA =
    form.mosfetState === "ON"
      ? "0101020304050607"
      : "0001020304050607"; // ✅ NO SPACES

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_BMS_REBOOT") {
  backendCommandType = "CAN";
                  
  const HEADER = "FFAA5501030015";
  const CAN_ID = "163A0180";  
  const CAN_DATA = "0000000000000000";

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_CELL_VOLT_DIFF_L2") {
  backendCommandType = "CAN";

  if (!form.voltDiff) {
    setStatus("Please enter voltage difference value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "168A0180";

  // 9 × 1000 = 9000 → 2328
  const decimalValue = Number(form.voltDiff) * 1000;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // Replace ONLY 4th & 5th byte
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_CELL_HIGH_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.cellHighVolt) {
    setStatus("Please enter cell high voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16800180";

  // 3.69 × 1000 = 3690 → 0E6A
  const decimalValue = Math.round(Number(form.cellHighVolt) * 1000);
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // Replace ONLY 4th & 5th byte
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}
if (form.commandType === "CAN_CELL_LOW_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.cellLowVolt) {
    setStatus("Please enter cell low voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16820180";

  // 2.5 × 1000 = 2500 → 09C4
  const decimalValue = Math.round(Number(form.cellLowVolt) * 1000);
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_TOTAL_HIGH_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.totalHighVolt) {
    setStatus("Please enter total high voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16810180";

  // 86V → 860 → 035C → 5C03 (little endian)
  const decimalValue = Math.round(Number(form.totalHighVolt) * 10);

  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const valueLE = swapBytes(hexValue);

  // FF 02 21 [LSB MSB] 00 00 00
  const CAN_DATA = `FF0221${valueLE}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_TOTAL_LOW_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.totalLowVolt) {
    setStatus("Please enter total low voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16830180";

  // 52 × 10 = 520 → 01FE
  const decimalValue = Number(form.totalLowVolt) * 10;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_NTC_TEMP_DIFF_L2") {
  backendCommandType = "CAN";

  if (!form.ntcTempDiff) {
    setStatus("Please enter NTC temperature difference");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "168B0180";

  // 50 → 32
  const hexValue = Number(form.ntcTempDiff)
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");

  const CAN_DATA = `FF022100${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_TOTAL_CHARGING_AH") {
  backendCommandType = "CAN";

  if (!form.totalChargingAh) {
    setStatus("Please enter total charging Ah");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "160A0180";

  // Multiply by 1000
  const decimalValue = Number(form.totalChargingAh) * 1000;

  // Decimal → HEX
  let hexValue = decimalValue.toString(16).toUpperCase();

  // Make exactly 8 HEX chars (4 bytes)
  hexValue = hexValue.padStart(8, "0");

  // CAN DATA: first 4 bytes value, rest zero
  const CAN_DATA = `${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_BMS_RATED_CAPACITY") {
  backendCommandType = "CAN";

  if (!form.bmsRatedCapacity) {
    setStatus("Please enter rated capacity");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16060180";

  // 60 → 60000 → EA60
  const decimalValue = Number(form.bmsRatedCapacity) * 1000;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `0000${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}
  }

  /* ========= API (FOR BOTH MODES) ========= */
  const payload = {
    vinNumber: form.vinNumber,
    commandType: backendCommandType,
    value: finalValue,
    clientId: "COMMANDCENTER",
  };

  console.log("🚀 Sending payload:", payload);

  setLoading(true);
  setStatus("Sending command...");

  try {
    const res = await fetch(
      "https://sb.rivotmotors.com/scooter/command",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setStatus(res.ok ? "Command sent successfully" : "Command failed");
  } catch (err) {
    setStatus("Network error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (vin) {
      setForm((prev) => ({ ...prev, vinNumber: vin }));
    }
  }, [vin]);

  // Auto-set AIRPLANE value
  useEffect(() => {
    if (form.commandType === "AIRPLANE") {
      setForm((prev) => ({ ...prev, value: "1" }));
    }
  }, [form.commandType]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value.toUpperCase() });
  };

  const setValue = (val) => {
    setForm((prev) => ({ ...prev, value: val }));
  };

  /* ================= VALIDATIONS ================= */
  const isHex = (val) => /^[0-9A-F]+$/.test(val);
  const isValidCanId = (id) => id.length === 8 && isHex(id);
  const isValidCanData = (data) => data.length === 16 && isHex(data);

  const handleRestart = async () => {
  const payload = {
    vinNumber: form.vinNumber,
    commandType: "RESTART",
    value: "1",
    clientId: "COMMANDCENTER",
  };

  setLoading(true);
  setStatus("Restarting vehicle...");

  try {
    const res = await fetch(
      "https://sb.rivotmotors.com/scooter/command",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setStatus(res.ok ? "Vehicle restart command sent" : "Restart failed");
  } catch (err) {
    console.error(err);
    setStatus("Network error");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (mode === "ADVANCED") return;

  if (
    form.commandType !== "CAN_RAW" &&
    form.commandType !== "CAN_SET_RPM"
  ) {
    setForm(prev => ({
      ...prev,
      canId: "",
      canData: "",
    }));
  }
}, [form.commandType, mode]);


const clearField = (field) => {
  setForm((prev) => ({ ...prev, [field]: "" }));
};

  const handleHexInput = (e, maxLength) => {
  const value = e.target.value
    .toUpperCase()
    .replace(/[^0-9A-F]/g, ""); // allow HEX only

  if (value.length <= maxLength) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  }
};

useEffect(() => {
  if (!status) return;

  const timer = setTimeout(() => {
    setStatus("");
  }, 3000); // ⏱ 4 seconds (you can change to 3000 or 5000)

  return () => clearTimeout(timer);
}, [status]);


  return(
        <div style={styles.page}>
  <form style={styles.form}>

  <div style={styles.modeToggle}>
  <button
    type="button"
    onClick={() => setMode("BASIC")}
    style={styles.modeBtn(mode === "BASIC")}
  >
    Basic
  </button>

  <button
    type="button"
    onClick={() => setMode("ADVANCED")}
    style={styles.modeBtn(mode === "ADVANCED")}
  >
    Advanced
  </button>
</div>

{mode === "BASIC" && (
  <>
    {/* 🔽 YOUR EXISTING UI — NO CHANGES INSIDE */}
    <h2 style={styles.title}>
      Send command to: <span style={styles.vin}>{vin}</span>
    </h2>
     {/* <div
    style={{
    textAlign: "center",
    marginBottom: "14px",
  }}
> */}
  {/* {vehicleStatus === "ONLINE" ? (
  <p className="text-sm font-semibold text-green-400">
    Vehicle is Online
  </p>
) : (
  <p className="text-sm font-semibold text-red-400">
    Vehicle is Offline
  </p>
)} */}

{/* </div> */}


{/* Module Selector */}
<div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
  <label style={{ cursor: "pointer" }}>
    <input
      type="radio"
      name="moduleType"
      value="CONTROLLER"
      checked={moduleType === "CONTROLLER"}
      onChange={() => setModuleType("CONTROLLER")}
      style={{ marginRight: "6px" }}
    />
    Controller
  </label>

  <label style={{ cursor: "pointer" }}>
    <input
      type="radio"
      name="moduleType"
      value="BMS"
      checked={moduleType === "BMS"}
      onChange={() => setModuleType("BMS")}
      style={{ marginRight: "6px" }}
    />
    BMS
  </label>
</div>

{moduleType === "CONTROLLER" && (
  <>
 <label style={styles.label}>Command type</label>
    <div style={styles.selectWrapper}>
     <select
      style={styles.input}
      name="commandType"
      value={form.commandType}
      onChange={handleChange}
      required
    >
    <option value="">Select command</option>
    <option value="POWER">Scooter ON / OFF</option>
    <option value="BLUETOOTH">Bluetooth</option>
    <option value="AIRPLANE">Airplane mode</option>

  {/* CAN commands */}
  <option value="CAN_RAW">CAN Command</option>
  <option value="CAN_SET_RPM">Set RPM</option>
  <option value="CAN_STE_DURATION">Boost duration</option>
  <option value="CAN_SET_INTRVAL">Boost interval</option>
  <option value="CAN_CURRENT">Line current</option>
  <option value="CAN_PASH_CURRENT">Phase current</option>
  <option value="CAN_REGEN_MIN">Regen current min</option>
  <option value="CAN_REGEN_MAX">Regen current max</option>
  <option value="CAN_GEAR_CTRL">Gear Controller</option>
  <option value="CAN_CRUISE_CTRL">Cruise Control</option>
  <option value="RESTART">Restart VCU Board</option>
  </select>
  <span style={styles.selectArrow}>▾</span>
  </div>


{(form.commandType === "POWER" || form.commandType === "BLUETOOTH") && (
            <>
              <p style={styles.label}>
                {form.commandType === "POWER" ? "Scooter power" : "Bluetooth mode"}
              </p>
              <div style={styles.row}>
                <button type="button" style={styles.toggle(form.value === "1")} onClick={() => setValue("1")}>ON</button>
                <button type="button" style={styles.toggle(form.value === "0")} onClick={() => setValue("0")}>OFF</button>
              </div>
            </>
)}

{form.commandType === "CAN_RAW" && (
  <>
    <label style={styles.label}>CAN Id</label>
    <input
      style={styles.input}
      name="canId"
      value={form.canId}
      maxLength={8}
      onChange={(e) => handleHexInput(e, 8)}
    />

    <label style={styles.label}>CAN Data</label>
    <input
      style={styles.input}
      name="canData"
      value={form.canData}
      maxLength={16}
      onChange={(e) => handleHexInput(e, 16)}
    />
  </>
)}

{form.commandType === "CAN_SET_RPM" && (
  <>
    <label style={styles.label}>Set RPM</label>
    <input
      type="number"
      style={styles.input}
      value={form.rpm}
      placeholder="Enter RPM value"
      onChange={(e) =>
        setForm({ ...form, rpm: e.target.value })
      }
      required
    />

    <label style={styles.label}>Boost Duration</label>
    <input
      type="number"
      style={styles.input}
      value={form.boostDuration}
      placeholder="default(5)"
      onChange={(e) =>
        setForm({ ...form, boostDuration: e.target.value })
      }
      required
    />

    <label style={styles.label}>Boost Interval</label>
    <input
      type="number"
      style={styles.input}
      value={form.boostInterval}
      placeholder="default(30)"
      onChange={(e) =>
        setForm({ ...form, boostInterval: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_STE_DURATION" && (
  <>
  <label style={styles.label}>Boost Duration</label>
    <input
      type="number"
      style={styles.input}
      value={form.boostDuration}
      placeholder="Enter Boost duration value"
      onChange={(e) =>
        setForm({ ...form, boostDuration: e.target.value })
      }
      required
    />
    <label style={styles.label}>Set RPM</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(3600)"
      value={form.rpm}
      onChange={(e) =>
        setForm({ ...form, rpm: e.target.value })
      }
      required
    />

    <label style={styles.label}>Boost Interval</label>
    <input
      type="number"
      style={styles.input}
      value={form.boostInterval}
      placeholder="default(30)"
      onChange={(e) =>
        setForm({ ...form, boostInterval: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_SET_INTRVAL" && (
  <>

   <label style={styles.label}>Boost Interval</label>
    <input
      type="number"
      style={styles.input}
      value={form.boostInterval}
      placeholder="Enter Boost interval value"
      onChange={(e) =>
        setForm({ ...form, boostInterval: e.target.value })
      }
      required
    />

    <label style={styles.label}>Set RPM</label>
    <input
      type="number"
      style={styles.input}
      value={form.rpm}
      placeholder="default(3600)"
      onChange={(e) =>
        setForm({ ...form, rpm: e.target.value })
      }
      required
    />


  <label style={styles.label}>Boost Duration</label>
    <input
      type="number"
      style={styles.input}
      value={form.boostDuration}
      placeholder="default(5)"
      onChange={(e) =>
        setForm({ ...form, boostDuration: e.target.value })
      }
      required
    />
   
  </>
)}

{form.commandType === "CAN_CURRENT" && (
  <>
    <label style={styles.label}>Line Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter Line current"
      value={form.lineCurrent}
      onChange={(e) =>
        setForm({ ...form, lineCurrent: e.target.value })
      }
    />

    <label style={styles.label}>Phase Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(300)"
      value={form.phaseCurrent}
      onChange={(e) =>
        setForm({ ...form, phaseCurrent: e.target.value })
      }
    />

    <label style={styles.label}>Regen Current Min (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(30)"
      value={form.regenMin}
      onChange={(e) =>
        setForm({ ...form, regenMin: e.target.value })
      }
    />

    <label style={styles.label}>Regen Current Max (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(40)"
      value={form.regenMax}
      onChange={(e) =>
        setForm({ ...form, regenMax: e.target.value })
      }
    />
  </>
)}

{form.commandType === "CAN_PASH_CURRENT" && (
  <>

  <label style={styles.label}>Phase Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter phase current"
      value={form.phaseCurrent}
      onChange={(e) =>
        setForm({ ...form, phaseCurrent: e.target.value })
      }
    />

    <label style={styles.label}>Line Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(100)"
      value={form.lineCurrent}
      onChange={(e) =>
        setForm({ ...form, lineCurrent: e.target.value })
      }
    />

    

    <label style={styles.label}>Regen Current Min (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(30)"
      value={form.regenMin}
      onChange={(e) =>
        setForm({ ...form, regenMin: e.target.value })
      }
    />

    <label style={styles.label}>Regen Current Max (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(40)"
      value={form.regenMax}
      onChange={(e) =>
        setForm({ ...form, regenMax: e.target.value })
      }
    />
  </>
)}

{form.commandType === "CAN_REGEN_MIN" && (
  <>
  <label style={styles.label}>Regen Current Min (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter min regen current"
      value={form.regenMin}
      onChange={(e) =>
        setForm({ ...form, regenMin: e.target.value })
      }
    />

    
    <label style={styles.label}>Line Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(100)"
      value={form.lineCurrent}
      onChange={(e) =>
        setForm({ ...form, lineCurrent: e.target.value })
      }
    />

    <label style={styles.label}>Phase Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(300)"
      value={form.phaseCurrent}
      onChange={(e) =>
        setForm({ ...form, phaseCurrent: e.target.value })
      }
    />

      <label style={styles.label}>Regen Current Max (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(40)"
      value={form.regenMax}
      onChange={(e) =>
        setForm({ ...form, regenMax: e.target.value })
      }
    />
    

    
  </>
)}

{form.commandType === "CAN_REGEN_MAX" && (
  <>

  <label style={styles.label}>Regen Current Max (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter max regen current "
      value={form.regenMax}
      onChange={(e) =>
        setForm({ ...form, regenMax: e.target.value })
      }
    />

    <label style={styles.label}>Line Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(100)"
      value={form.lineCurrent}
      onChange={(e) =>
        setForm({ ...form, lineCurrent: e.target.value })
      }
    />

    <label style={styles.label}>Phase Current (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(300)"
      value={form.phaseCurrent}
      onChange={(e) =>
        setForm({ ...form, phaseCurrent: e.target.value })
      }
    />

    <label style={styles.label}>Regen Current Min (A)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="default(30)"
      value={form.regenMin}
      onChange={(e) =>
        setForm({ ...form, regenMin: e.target.value })
      }
    />

  </>
)}

{form.commandType === "CAN_GEAR_CTRL" && (
  <>
    <label style={styles.label}>Gear Controller</label>

    <div style={styles.row}>
      <button
        type="button"
        style={styles.toggle(form.gear === "FORWARD")}
        onClick={() => setForm({ ...form, gear: "FORWARD" })}
      >
        Forward
      </button>

      <button
        type="button"
        style={styles.toggle(form.gear === "NEUTRAL")}
        onClick={() => setForm({ ...form, gear: "NEUTRAL" })}
      >
        Neutral
      </button>

      <button
        type="button"
        style={styles.toggle(form.gear === "BACKWARD")}
        onClick={() => setForm({ ...form, gear: "BACKWARD" })}
      >
        Backward
      </button>
    </div>
  </>
)}

{form.commandType === "CAN_CRUISE_CTRL" && (
  <>
    <label style={styles.label}>Cruise Control</label>

    <div style={styles.row}>
      <button
        type="button"
        style={styles.toggle(form.cruise === "ON")}
        onClick={() => setForm({ ...form, cruise: "ON" })}
      >
        Cruise ON
      </button>

      <button
        type="button"
        style={styles.toggle(form.cruise === "OFF")}
        onClick={() => setForm({ ...form, cruise: "OFF" })}
      >
        Cruise OFF
      </button>
    </div>
  </>
)}


{form.commandType === "RESTART" ? (
         <button
        type="button"
        style={{
          ...styles.restart,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
        onClick={handleRestart}
        disabled={loading}
      >
        {loading ? "Restarting..." : "Restart vehicle"}
      </button>
) : (
<button
  type="button"
  style={{
    ...styles.submit,
    opacity: loading ? 0.6 : 1,
    cursor: loading ? "not-allowed" : "pointer",
  }}
  disabled={loading}
  onClick={openConfirmPopup}
>
  Send command
</button>

  )}
  {status && (
          <p
            style={{
              ...styles.status,
              ...(status.includes("success")
                ? styles.statusSuccess
                : status.includes("fail") || status.includes("error")
                ? styles.statusError
                : styles.statusInfo),
            }}
          >
            {status}
          </p>
  )}

{showConfirm && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>
      <h3 style={styles.modalTitle}>Confirm Details</h3>

      <div style={styles.modalContent}>
        <p><strong>VIN:</strong> { vin}</p>
        <p><strong>Owner:</strong> {ownerName || "N/A"}</p>
        <p><strong>Phone:</strong> {phoneNumber || "N/A"}</p>
        <p>
          <strong>Location:</strong>{" "}
          {location
            ? `${location.lat}, ${location.lng}`
            : "N/A"}
        </p>
      </div>

      <div style={styles.modalActions}>
        <button
          style={styles.cancelBtn}
          onClick={() => setShowConfirm(false)}
        >
          Cancel
        </button>

       <button
        style={styles.confirmBtn}
        onClick={() => {
          setShowConfirm(false);
          sendCommand(); // ✅ API happens HERE
        }}
      >
        Send
      </button>

      </div>
    </div>
  </div>
)}
  </>
)}


{moduleType === "BMS" && (
  <>
    {/* Command Type */}
    <label style={styles.label}>Command type</label>
    <div style={styles.selectWrapper}>
      <select
        style={styles.input}
        name="commandType"
        value={form.commandType}
        onChange={handleChange}
        required
      >
        <option value="">Select command</option>
        <option value="CAN_RATED_CAPACITY">CAN Rated Capacity</option>
        <option value="CAN_REMAINING_CAPACITY">CAN REMAINING CAPACITY</option>
        <option value="CAN_TOTAL_CHARGING_AH">Set Total Charging Ah</option>
        <option value="CAN_TOTAL_DISCHARGING_AH">Total Discharging AH (OUT)</option>
        <option value="CAN_BALANCING_CURRENT">Set Balancing Current</option>
        <option value="CAN_CHG_TEMP_HIGH_L2">Charging Temp High Fault – Level 2</option>
         <option value="CAN_DES_TEMP_HIGH_L2">Discharging Temp High Fault – Level 2</option>
         <option value="CAN_CHG_OVERCURRENT_L2">Charge Overcurrent Fault – Level 2</option>
         <option value="CAN_DISCHG_OVERCURRENT_L2">Discharge Overcurrent Fault – Level 2</option>
         <option value="CAN_SOC_LOW_L2">SOC Too Low Fault – Level 2</option>
         <option value="CAN_NTC_TEMP_DIFF_L2">Set Temp Difference Between NTCs – Level 2</option>
        <option value="CAN_MANUAL_SOC">Set Manual SOC</option>
        <option value="CAN_CHG_MOSFET">Charging MOSFET ON / OFF</option>
        <option value="CAN_DISCHG_MOSFET">Discharge MOSFET ON / OFF</option>
        <option value="CAN_BMS_REBOOT">BMS Reboot</option>
        <option value="CAN_CELL_VOLT_DIFF_L2">Set Voltage Difference Fault – Level 2</option>
        <option value="CAN_CELL_HIGH_VOLT_L2">Set Single Cell Voltage High Fault – Level 2</option>
        <option value="CAN_CELL_LOW_VOLT_L2">Set Single Cell Voltage Low Fault – Level 2</option>
        <option value="CAN_TOTAL_HIGH_VOLT_L2">Set Total High Voltage Threshold – Level 2</option>
        <option value="CAN_TOTAL_LOW_VOLT_L2">Set Total Low Voltage Threshold – Level 2</option>



      </select>
      <span style={styles.selectArrow}>▾</span>
    </div>

    {/* Rated Capacity Input */}
    {form.commandType === "CAN_RATED_CAPACITY" && (
      <>
        <label style={styles.label}>Set Rated Capacity</label>
        <input
          type="number"
          style={styles.input}
          placeholder="Enter capacity (e.g. 60)"
          value={form.capacityValue || ""}
          onChange={(e) =>
            setForm({ ...form, capacityValue: e.target.value })
          }
          required
        />
      </>
    )}

    {form.commandType === "CAN_REMAINING_CAPACITY" && (
  <>
    <label style={styles.label}>Set Remaining Capacity</label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter remaining capacity (e.g. 80)"
      value={form.remainingCapacityValue || ""}
      onChange={(e) =>
        setForm({ ...form, remainingCapacityValue: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_TOTAL_CHARGING_AH" && (
  <>
    <label style={styles.label}>
      Set Total Charging Ampere-Hour (Ah)
    </label>

    <input
      type="number"
      style={styles.input}
      placeholder="Enter Ah (e.g. 60)"
      value={form.totalChargingAh || ""}
      onChange={(e) =>
        setForm({ ...form, totalChargingAh: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_TOTAL_DISCHARGING_AH" && (
  <>
    <label style={styles.label}>
      Set Total Discharging Ampere-Hour (OUT Ah)
    </label>

    <input
      type="number"
      style={styles.input}
      placeholder="Enter Ah (e.g. 60)"
      value={form.totalDischargingAh || ""}
      onChange={(e) =>
        setForm({ ...form, totalDischargingAh: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_BALANCING_CURRENT" && (
  <>
    <label style={styles.label}>Set Balancing Current (A)</label>
    <input
      type="number"
      step="0.1"
      style={styles.input}
      placeholder="Enter current (e.g. 1.5)"
      value={form.balanceCurrent || ""}
      onChange={(e) =>
        setForm({ ...form, balanceCurrent: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_CHG_TEMP_HIGH_L2" && (
  <>
    <label style={styles.label}>
      Set Charging Temp High Fault – Level 2 (°C)
    </label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter temperature (e.g. 90)"
      value={form.tempValue || ""}
      onChange={(e) =>
        setForm({ ...form, tempValue: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_DES_TEMP_HIGH_L2" && (
  <>
    <label style={styles.label}>
      Set Charging Temp High Fault – Level 2 (°C)
    </label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter temperature (e.g. 90)"
      value={form.tempValue || ""}
      onChange={(e) =>
        setForm({ ...form, tempValue: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_CHG_OVERCURRENT_L2" && (
  <>
    <label style={styles.label}>
      Set Charge Overcurrent Fault – Level 2 (A)
    </label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter current (e.g. 90)"
      value={form.overCurrent || ""}
      onChange={(e) =>
        setForm({ ...form, overCurrent: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_DISCHG_OVERCURRENT_L2" && (
  <>
    <label style={styles.label}>
      Set Discharge Overcurrent Fault – Level 2 (A)
    </label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter current (e.g. 90)"
      value={form.overCurrent || ""}
      onChange={(e) =>
        setForm({ ...form, overCurrent: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_SOC_LOW_L2" && (
  <>
    <label style={styles.label}>
      Set SOC Too Low Fault – Level 2 (%)
    </label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter SOC % (e.g. 7)"
      value={form.socValue || ""}
      onChange={(e) =>
        setForm({ ...form, socValue: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_MANUAL_SOC" && (
  <>
    <label style={styles.label}>Set Manual SOC (%)</label>
    <input
      type="number"
      style={styles.input}
      placeholder="Enter SOC (e.g. 90)"
      value={form.manualSoc || ""}
      onChange={(e) =>
        setForm({ ...form, manualSoc: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_CHG_MOSFET" && (
  <>
    <label style={styles.label}>Charging MOSFET</label>

    <div style={{ display: "flex", gap: "10px" }}>
      <button
        type="button"
        onClick={() =>
          setForm({ ...form, mosfetState: "ON" })
        }
        style={{
          padding: "10px 18px",
          background:
            form.mosfetState === "ON" ? "#22c55e" : "#1f2933",
          color: "#fff",
          borderRadius: "6px",
          border: "none",
          fontWeight: "600",
        }}
      >
        ON
      </button>

      <button
        type="button"
        onClick={() =>
          setForm({ ...form, mosfetState: "OFF" })
        }
        style={{
          padding: "10px 18px",
          background:
            form.mosfetState === "OFF" ? "#ef4444" : "#1f2933",
          color: "#fff",
          borderRadius: "6px",
          border: "none",
          fontWeight: "600",
        }}
      >
        OFF
      </button>
    </div>
  </>
)}


{form.commandType === "CAN_DISCHG_MOSFET" && (
  <>
    <label style={styles.label}>Discharging MOSFET</label>

    <div style={{ display: "flex", gap: "10px" }}>
      <button
        type="button"
        onClick={() =>
          setForm({ ...form, mosfetState: "ON" })
        }
        style={{
          padding: "10px 18px",
          background:
            form.mosfetState === "ON" ? "#22c55e" : "#1f2933",
          color: "#fff",
          borderRadius: "6px",
          border: "none",
          fontWeight: "600",
        }}
      >
        ON
      </button>

      <button
        type="button"
        onClick={() =>
          setForm({ ...form, mosfetState: "OFF" })
        }
        style={{
          padding: "10px 18px",
          background:
            form.mosfetState === "OFF" ? "#ef4444" : "#1f2933",
          color: "#fff",
          borderRadius: "6px",
          border: "none",
          fontWeight: "600",
        }}
      >
        OFF
      </button>
    </div>
  </>
)}

{/* {form.commandType === "CAN_DISCHG_MOSFET" && (
  <>
    <label style={styles.label}>Discharging MOSFET</label>

    <div style={{ display: "flex", gap: "10px" }}>
      <button
        type="button"
        onClick={() =>
          setForm({ ...form, disMosfetState: "ON" })
        }
        style={{
          padding: "10px 18px",
          background:
            form.disMosfetState === "ON" ? "#22c55e" : "#1f2933",
          color: "#fff",
          borderRadius: "6px",
          border: "none",
          fontWeight: "600",
        }}
      >
        ON
      </button>

      <button
        type="button"
        onClick={() =>
          setForm({ ...form, disMosfetState: "OFF" })
        }
        style={{
          padding: "10px 18px",
          background:
            form.disMosfetState === "OFF" ? "#ef4444" : "#1f2933",
          color: "#fff",
          borderRadius: "6px",
          border: "none",
          fontWeight: "600",
        }}
      >
        OFF
      </button>
    </div>
  </>
)} */}

{form.commandType === "CAN_BMS_REBOOT" && (
  <>
    {/* <label style={styles.label}>BMS Reboot</label> */}

    <button
      type="button"
      style={{
        padding: "12px 20px",
        background: "#ef4444",
        color: "#fff",
        borderRadius: "6px",
        border: "none",
        fontWeight: "700",
        cursor: "pointer",
        marginTop:"15px",
      }}
      onClick={openConfirmPopup}
    >
      Reboot BMS
    </button>
  </>
)}

{form.commandType === "CAN_CELL_VOLT_DIFF_L2" && (
  <>
    <label style={styles.label}>
      Cell Voltage Difference Threshold (mV)
    </label>

    <input
      type="number"
      style={styles.input}
      placeholder="Enter value (e.g. 90)"
      value={form.voltDiff || ""}
      onChange={(e) =>
        setForm({ ...form, voltDiff: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_CELL_HIGH_VOLT_L2" && (
  <>
    <label style={styles.label}>
      Cell High Voltage Threshold (V)
    </label>

    <input
      type="number"
      step="0.01"
      style={styles.input}
      placeholder="Enter voltage (e.g. 3.69)"
      value={form.cellHighVolt || ""}
      onChange={(e) =>
        setForm({ ...form, cellHighVolt: e.target.value })
      }
      required
    />
  </>
)}


{form.commandType === "CAN_CELL_LOW_VOLT_L2" && (
  <>
    <label style={styles.label}>
      Cell Low Voltage Threshold (V)
    </label>

    <input
      type="number"
      step="0.01"
      style={styles.input}
      placeholder="Enter voltage (e.g. 2.5)"
      value={form.cellLowVolt || ""}
      onChange={(e) =>
        setForm({ ...form, cellLowVolt: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_TOTAL_HIGH_VOLT_L2" && (
  <>
    <label style={styles.label}>
      Total High Voltage Threshold (V)
    </label>

    <input
      type="number"
      style={styles.input}
      placeholder="Enter voltage (e.g. 86)"
      value={form.totalHighVolt || ""}
      onChange={(e) =>
        setForm({ ...form, totalHighVolt: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_TOTAL_LOW_VOLT_L2" && (
  <>
    <label style={styles.label}>
      Total Low Voltage Threshold (V)
    </label>

    <input
      type="number"
      style={styles.input}
      placeholder="Enter voltage (e.g. 52)"
      value={form.totalLowVolt || ""}
      onChange={(e) =>
        setForm({ ...form, totalLowVolt: e.target.value })
      }
      required
    />
  </>
)}

{form.commandType === "CAN_NTC_TEMP_DIFF_L2" && (
  <>
    <label style={styles.label}>
      NTC Temperature Difference (°C)
    </label>

    <input
      type="number"
      style={styles.input}
      placeholder="Enter temp diff (e.g. 50)"
      value={form.ntcTempDiff || ""}
      onChange={(e) =>
        setForm({ ...form, ntcTempDiff: e.target.value })
      }
      required
    />
  </>
)}

    {/* Send Button */}
   {form.commandType !== "CAN_BMS_REBOOT" && (
  <button
    type="button"
    style={{
      ...styles.submit,
      opacity: loading ? 0.6 : 1,
      cursor: loading ? "not-allowed" : "pointer",
    }}
    disabled={loading}
    onClick={openConfirmPopup}
  >
    Send command
  </button>
)}



    {/* Status */}
    {status && (
      <p
        style={{
          ...styles.status,
          ...(status.includes("success")
            ? styles.statusSuccess
            : status.includes("fail") || status.includes("error")
            ? styles.statusError
            : styles.statusInfo),
        }}
      >
        {status}
      </p>
    )}

    {/* Confirm Popup */}
    {showConfirm && (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <h3 style={styles.modalTitle}>Confirm Details</h3>

          <div style={styles.modalContent}>
            <p><strong>VIN:</strong> {vin}</p>
            <p><strong>Owner:</strong> {ownerName || "N/A"}</p>
            <p><strong>Phone:</strong> {phoneNumber || "N/A"}</p>
            <p>
              <strong>Location:</strong>{" "}
              {location ? `${location.lat}, ${location.lng}` : "N/A"}
            </p>
          </div>

          <div style={styles.modalActions}>
            <button
              style={styles.cancelBtn}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>

            <button
              style={styles.confirmBtn}
              onClick={() => {
                setShowConfirm(false);
                sendCommand(); // ✅ API CALL
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)}

  </>  
)}

{mode === "ADVANCED" && (
  <>
    <h2 style={styles.title}>
      Send command to: <span style={styles.vin}>{vin}</span>
    </h2>

    {/* Vehicle Status */}
    {/* <div style={{ textAlign: "center", marginBottom: "14px" }}> */}
     {/* {vehicleStatus === "ONLINE" ? (
  <p className="text-sm font-semibold text-green-400">
    Vehicle is Online
  </p>
) : (
  <p className="text-sm font-semibold text-red-400">
    Vehicle is Offline
  </p>
)} */}

    {/* </div> */}

    <h2 style={styles.headerforcan}  >CAN Command</h2>

    {/* CAN RAW – always visible */}
    <label style={styles.label}>CAN Id</label>
    <input
      style={styles.input}
      name="canId"
      value={form.canId}
      maxLength={8}
      onChange={(e) => handleHexInput(e, 8)}
    />

    <label style={styles.label}>CAN Data</label>
    <input
      style={styles.input}
      name="canData"
      value={form.canData}
      maxLength={16}
      onChange={(e) => handleHexInput(e, 16)}
    />

    {/* Send Button */}
    <button
      type="button"
      style={{
        ...styles.submit,
        opacity: loading ? 0.6 : 1,
        cursor: loading ? "not-allowed" : "pointer",
      }}
      disabled={loading}
      onClick={openConfirmPopup}
    >
      Send command
    </button>

    {/* Status Message */}
    {status && (
      <p
        style={{
          ...styles.status,
          ...(status.includes("success")
            ? styles.statusSuccess
            : status.includes("fail") || status.includes("error")
            ? styles.statusError
            : styles.statusInfo),
        }}
      >
        {status}
      </p>
    )}
  </>
)}

 {showConfirm && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>
      <h3 style={styles.modalTitle}>Confirm Details</h3>

      <div style={styles.modalContent}>
        <p><strong>VIN:</strong> { vin}</p>
        <p><strong>Owner:</strong> {ownerName || "N/A"}</p>
        <p><strong>Phone:</strong> {phoneNumber || "N/A"}</p>
        <p>
          <strong>Location:</strong>{" "}
          {location
            ? `${location.lat}, ${location.lng}`
            : "N/A"}
        </p>
      </div>

      <div style={styles.modalActions}>
        <button
          style={styles.cancelBtn}
          onClick={() => setShowConfirm(false)}
        >
          Cancel
        </button>

       <button
        style={styles.confirmBtn}
        onClick={() => {
          setShowConfirm(false);
          sendCommand(); // ✅ API happens HERE
        }}
      >
        Send
      </button>

      </div>
    </div>
  </div>
)}
      </form>
    </div>
  );
}

const styles = {
  page: {
  height: "calc(100vh - 72px)", // 👈 subtract navbar height
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px",
  background: "linear-gradient(180deg, #0b0b0b 0%, #000 100%)",
},

selectWrapper: {
  position: "relative",
},

selectArrow: {
  position: "absolute",
  right: 16,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#ff9f1c",
  pointerEvents: "none", // 👈 click goes to select
  fontSize: 14,
},

  form: {
    width: 440,
    padding: 32,
    borderRadius: 18,
    background: "#121212",
    border: "1px solid #1f1f1f",
    boxShadow: "0 25px 60px rgba(0,0,0,.6)",
    color: "#eaeaea",

  },

  title: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 1,
  },

  label: {
    marginTop: 25,
    fontSize: 16,
    color: "#ff9f1c",
    letterSpacing: 0.6,
    marginBottom:0
  },

  vin: {
  color: "#ec760eff",       // green (premium look)
  fontWeight: "700",
  letterSpacing: "1px",
},

 input: {
  width: "100%",
  marginTop: 5,
  padding: "12px 48px 12px 14px", // 👈 EXTRA RIGHT SPACE FOR ARROW
  borderRadius: 10,
  background: "#0b0b0b",
  border: "1px solid #2a2a2a",
  color: "#fff",
  outline: "none",
  marginBottom: 10,
  appearance: "none",        // 👈 remove default arrow
  WebkitAppearance: "none",
  MozAppearance: "none",
  },


  inputWrapper: {
  position: "relative",
},

clear: {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  fontSize: "14px",
  color: "#aaa",
},


  row: {
    display: "flex",
    gap: 12,
    marginTop: 14,
  },

  toggle: (active) => ({
    flex: 1,
    padding: "12px 0",
    borderRadius: 12,
    border: active ? "1px solid #ff9f1c" : "1px solid #2a2a2a",
    background: active ? "#ff9f1c" : "#0b0b0b",
    color: active ? "#000" : "#ccc",
    fontWeight: 600,
    cursor: "pointer",
  }),

  restart: {
    marginTop: 14,
    width: "100%",
    padding: "13px 0",
    borderRadius: 12,
    background: "#1a1a1a",
    border: "1px solid #ff9f1c",
    color: "#ff9f1c",
    fontWeight: 700,
    cursor: "pointer",
  },

  submit: {
    marginTop: 30,
    width: "100%",
    padding: 14,
    borderRadius: 14,
    background: "#ff9f1c",
    color: "#000",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },

  status: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 13,
    color: "#bbb",
  },


  status: {
  marginTop: 18,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "center",
  letterSpacing: "0.6px",
},

statusSuccess: {
  color: "#22c55e",
},

statusError: {
  color: "#ef4444",
},

statusInfo: {
  color: "#f59e0b",
},


modeToggle: {
  display: "flex",
  gap: 8,
  marginBottom: 20,
  background: "#0b0b0b",
  padding: 6,
  borderRadius: 12,
  border: "1px solid #1f1f1f",
},

modeBtn: (active) => ({
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: "none",
  background: active ? "#ff9f1c" : "transparent",
  color: active ? "#000" : "#aaa",
  fontWeight: 700,
  cursor: "pointer",
  transition: "0.2s",
}),

advancedEmpty: {
  height: 200,
  borderRadius: 14,
  border: "1px dashed #333",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#555",
  fontSize: 14,
},


modalOverlay: {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
},

modal: {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "400px",
  color: "#e5e7eb",
},

modalTitle: {
  marginBottom: "12px",
  fontSize: "18px",
},

modalContent: {
  fontSize: "14px",
  lineHeight: "1.6",
},

modalActions: {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "16px",
},

cancelBtn: {
  background: "#334155",
  color: "#e5e7eb",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
},

confirmBtn: {
  background: "#22c55e",
  color: "#022c22",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
},

headerforcan : {
textAlign : "Center",
color : "#ff9f1c",
Weight : "bold"
}};




