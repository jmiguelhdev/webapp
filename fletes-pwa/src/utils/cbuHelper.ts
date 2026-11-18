// Port 1:1 de IosFletes/Utilities/CBUHelper.swift

export interface CBUInfo {
  rawCBU: string;
  isValidLength: boolean;
  bankCode: string;
  bankName: string;
  branchCode: string | null;
  checkDigit1: string | null;
  accountNumber: string | null;
  rawAccountNumber: string | null;
  checkDigit2: string | null;
  isCVU: boolean;
}

export const bankDirectory: Record<string, string> = {
  '005': 'The Royal Bank of Scotland',
  '007': 'Banco Galicia',
  '011': 'Banco de la Nación Argentina',
  '014': 'Banco de la Provincia de Buenos Aires',
  '015': 'ICBC Argentina',
  '016': 'Citibank N.A.',
  '017': 'Banco BBVA Argentina',
  '018': 'The Bank of Tokyo-Mitsubishi UFJ',
  '020': 'Banco de la Provincia de Córdoba (Bancor)',
  '027': 'Banco Supervielle',
  '029': 'Banco Ciudad de Buenos Aires',
  '034': 'Banco Patagonia',
  '044': 'Banco Hipotecario',
  '045': 'Banco de San Juan',
  '046': 'Banco do Brasil',
  '060': 'BAPRO Mandatos y Negocios',
  '065': 'Banco Municipal de Rosario',
  '072': 'Banco Santander Argentina',
  '083': 'Banco del Chubut',
  '086': 'Banco de Santa Cruz',
  '093': 'Banco de La Pampa',
  '094': 'Banco de Corrientes',
  '097': 'Banco Provincia del Neuquén',
  '143': 'Brubank',
  '147': 'Banco Interfinanzas (BST)',
  '150': 'HSBC Bank Argentina',
  '165': 'J.P. Morgan Chase Bank',
  '191': 'Banco Credicoop Cooperativo',
  '198': 'Banco de Valores',
  '247': 'Banco Roela',
  '254': 'Banco Mariva',
  '259': 'Banco Itaú Argentina',
  '262': 'Bank of China',
  '266': 'BNP Paribas',
  '268': 'Banco Provincia de Tierra del Fuego',
  '269': 'Banco de la República Oriental del Uruguay',
  '277': 'Banco Sáenz',
  '281': 'Banco Meridian',
  '285': 'Banco Macro',
  '299': 'Banco Comafi',
  '300': 'BICE (Banco de Inversión y Comercio Exterior)',
  '301': 'Banco Piano',
  '305': 'Banco Julio',
  '309': 'Banco Rioja',
  '310': 'Banco del Sol',
  '311': 'Nuevo Banco del Chaco',
  '312': 'Banco Voii',
  '315': 'Banco de Formosa',
  '319': 'Banco CMF',
  '321': 'Banco de Santiago del Estero',
  '322': 'Nuevo Banco de Santa Fe',
  '325': 'Banco Cetelem',
  '330': 'Banco BMA (ex Itaú)',
  '331': 'Banco Coinag',
  '332': 'Banco de Comercio',
  '336': 'Banco Bradesco Argentina',
  '338': 'Banco de Servicios Financieros',
  '339': 'Banco RCI Argentina',
  '340': 'BACS Banco de Crédito y Securitización',
  '341': 'Banco Masventas',
  '384': 'Wilobank / Ualá',
  '386': 'Nuevo Banco de Entre Ríos',
  '389': 'Banco Columbia',
  '401': 'Compañía Financiera Argentina',
  '415': 'Transatlántica C.F.',
  '422': 'Crédito Regional C.F.',
  '431': 'Banco Columbia C.F.',
  '432': 'Cuota Ya C.F.',
  '448': 'Rombo Cía. Financiera',
  '453': 'FCA Compañía Financiera',
};

export const cvuDirectory: Record<string, string> = {
  '00000031': 'Mercado Pago',
  '00000038': 'Ualá',
  '00000045': 'Ualá',
  '00000067': 'Personal Pay',
  '00000079': 'Ualá',
  '00000028': 'Ripio',
  '00000017': 'Prex',
  '00000048': 'IOL Inversiones (InvertirOnline)',
  '00000053': 'Lemon Cash',
  '00000057': "Let'sBit",
  '00000085': 'Claro Pay',
  '00000033': 'Plus Cambio',
};

export const CBUHelper = {
  cleanDigits(raw: string): string {
    return (raw || '').replace(/\D/g, '');
  },

  isValidCBU(raw: string): boolean {
    return this.cleanDigits(raw).length === 22;
  },

  isValidCUIT(raw: string): boolean {
    return this.cleanDigits(raw).length === 11;
  },

  bankName(cbu: string): string {
    const digits = this.cleanDigits(cbu);
    if (digits.startsWith('00000') && digits.length >= 8) {
      const pspCode = digits.slice(0, 8);
      return cvuDirectory[pspCode] ?? 'Billetera Virtual (CVU)';
    }
    if (digits.length < 3) {
      return 'Banco no identificado';
    }
    const code = digits.slice(0, 3);
    if (bankDirectory[code]) {
      return bankDirectory[code];
    }
    if (digits.startsWith('000')) {
      return 'Billetera Virtual / PSP';
    }
    return `Entidad Bancaria (${code})`;
  },

  accountNumber(cbu: string): string | null {
    const digits = this.cleanDigits(cbu);
    if (digits.length !== 22) return null;
    const rawAcc = digits.slice(8, 21);
    const trimmed = rawAcc.replace(/^0+/, '');
    return trimmed || '0';
  },

  decode(cbu: string): CBUInfo {
    const digits = this.cleanDigits(cbu);
    const isValid = digits.length === 22;

    if (!isValid) {
      const partialBank = digits.length >= 3 ? this.bankName(digits) : 'Entidad no identificada';
      const code = digits.length >= 3 ? digits.slice(0, 3) : '';
      return {
        rawCBU: digits,
        isValidLength: false,
        bankCode: code,
        bankName: partialBank,
        branchCode: null,
        checkDigit1: null,
        accountNumber: null,
        rawAccountNumber: null,
        checkDigit2: null,
        isCVU: false,
      };
    }

    const isCVU = digits.startsWith('00000');
    if (isCVU) {
      const pspCode = digits.slice(0, 8);
      const name = cvuDirectory[pspCode] ?? 'Billetera Virtual (CVU)';
      const rawAcc = digits.slice(8);
      const trimmed = rawAcc.replace(/^0+/, '');
      return {
        rawCBU: digits,
        isValidLength: true,
        bankCode: pspCode,
        bankName: name,
        branchCode: null,
        checkDigit1: null,
        accountNumber: trimmed || '0',
        rawAccountNumber: rawAcc,
        checkDigit2: null,
        isCVU: true,
      };
    }

    const bankCode = digits.slice(0, 3);
    const bankName = bankDirectory[bankCode] ?? `Entidad Bancaria (${bankCode})`;
    const branchCode = digits.slice(3, 7);
    const checkDigit1 = digits.slice(7, 8);
    const rawAcc = digits.slice(8, 21);
    const checkDigit2 = digits.slice(21, 22);
    const trimmed = rawAcc.replace(/^0+/, '');

    return {
      rawCBU: digits,
      isValidLength: true,
      bankCode,
      bankName,
      branchCode,
      checkDigit1,
      accountNumber: trimmed || '0',
      rawAccountNumber: rawAcc,
      checkDigit2,
      isCVU: false,
    };
  },

  formattedCBU(raw: string): string {
    const digits = this.cleanDigits(raw);
    if (digits.length !== 22) return raw;
    return `${digits.slice(0, 8)} ${digits.slice(8)}`;
  },

  accountDisplay(info: CBUInfo): string {
    if (!info.accountNumber) return '-';
    if (info.rawAccountNumber && info.rawAccountNumber !== info.accountNumber) {
      return `${info.accountNumber} (13 dig: ${info.rawAccountNumber})`;
    }
    return info.accountNumber;
  },
};
