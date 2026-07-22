/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Código Oficial das 21 Províncias de Angola (Divisão Político-Administrativa Atualizada)
 * Inclui as novas províncias resultantes da reorganização territorial.
 */
export const PROVINCE_CODES: Record<string, string> = {
  "Cabinda": "CAB",
  "Zaire": "ZAI",
  "Uíge": "UIG",
  "Bengo": "BGO",
  "Icolo e Bengo": "ICB",  // Nova Província
  "Luanda": "LUA",
  "Cuanza-Norte": "CNO",
  "Cuanza-Sul": "CSU",
  "Malanje": "MAL",
  "Lunda-Norte": "LNO",
  "Lunda-Sul": "LSU",
  "Benguela": "BGU",
  "Huambo": "HUA",
  "Bié": "BIE",
  "Moxico": "MOX",
  "Moxico Leste": "MXL",   // Nova Província
  "Huíla": "HUI",
  "Namibe": "NAM",
  "Cunene": "CNN",
  "Cubango": "CCU",        // Renomeada (ex-Cuando Cubango Oeste)
  "Quando": "CND"          // Nova Província (ex-Cuando Cubango Leste)
};

export const PROVINCE_BY_CODE: Record<string, string> = Object.entries(PROVINCE_CODES).reduce(
  (acc, [name, code]) => {
    acc[code] = name;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Endereço Territorial Hierárquico do KMOS
 * Permite flexibilidade dinâmica para Municípios, Comunas, Bairros e Ruas,
 * mantendo ancoragem estrita no código de província BNA.
 */
export interface TerritorialAddress {
  provinceCode: string;       // Código oficial de 3 letras (ex: "LUA", "ICB", "MXL")
  provinceName?: string;      // Nome formal da Província
  municipality: string;       // Definido dinamicamente (ex: "Belas", "Cazenga", "Moxico")
  commune?: string;           // Definido dinamicamente (ex: "Kilamba", "Talatona")
  neighborhood?: string;      // Bairro (Definido dinamicamente)
  street?: string;            // Rua / Avenida (Definido dinamicamente)
  postalOrZoneCode?: string;  // Código de Zona / Roteamento local
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Resultado de Validação de Limites Territoriais
 */
export interface TerritorialValidationResult {
  isValid: boolean;
  provinceCode: string;
  provinceName: string;
  formattedJurisdictionTag: string; // Ex: "AO-ICB-CATETE"
  errors: string[];
}

/**
 * Serviço do Domínio de Território e Jurisdição Nacional
 */
export class TerritoryDomainService {
  /**
   * Valida o enquadramento territorial de uma entidade (Agente, Comerciante ou Usuário)
   */
  public static validateAddress(address: Partial<TerritorialAddress>): TerritorialValidationResult {
    const errors: string[] = [];

    if (!address.provinceCode) {
      errors.push("Código da Província é obrigatório.");
    } else if (!PROVINCE_BY_CODE[address.provinceCode]) {
      errors.push(`Código de província inválido: '${address.provinceCode}'. Deve ser uma das 21 províncias oficiais de Angola.`);
    }

    if (!address.municipality || address.municipality.trim().length === 0) {
      errors.push("Município é obrigatório para delimitação territorial.");
    }

    const provinceCode = address.provinceCode || "LUA";
    const provinceName = PROVINCE_BY_CODE[provinceCode] || "Luanda";
    const municipalityClean = (address.municipality || "GERAL").toUpperCase().replace(/[^A-Z0-9]/g, "");

    const formattedJurisdictionTag = `AO-${provinceCode}-${municipalityClean}`;

    return {
      isValid: errors.length === 0,
      provinceCode,
      provinceName,
      formattedJurisdictionTag,
      errors
    };
  }

  /**
   * Lista de todas as 21 províncias com metadados para seleção visual e validação
   */
  public static getOfficialProvinces() {
    return Object.entries(PROVINCE_CODES).map(([name, code]) => ({
      name,
      code,
      isNewDivision: ["ICB", "MXL", "CCU", "CND"].includes(code)
    }));
  }

  /**
   * Resolve o nome da província através do código de 3 letras
   */
  public static getProvinceNameByCode(code: string): string {
    return PROVINCE_BY_CODE[code.toUpperCase()] || "Desconhecida";
  }
}
