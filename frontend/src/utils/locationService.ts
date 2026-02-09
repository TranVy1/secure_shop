import locationData from '../data/locations.json';

// Interfaces for the component state (matching the API response structure expected by components)
export interface Province {
    province_id: string;
    province_name: string;
}

export interface District {
    district_id: string;
    district_name: string;
}

export interface Ward {
    ward_id: string;
    ward_name: string;
}

// Interfaces for the raw JSON data
interface RawWard {
    Id: string;
    Name: string;
    Level: string;
}

interface RawDistrict {
    Id: string;
    Name: string;
    Wards: RawWard[];
}

interface RawProvince {
    Id: string;
    Name: string;
    Districts: RawDistrict[];
}

const rawData = locationData as RawProvince[];

export const getProvinces = (): Province[] => {
    return rawData.map(p => ({
        province_id: p.Id,
        province_name: p.Name
    }));
};

export const getDistricts = (provinceId: string): District[] => {
    const province = rawData.find(p => p.Id === provinceId);
    if (!province) return [];
    return province.Districts.map(d => ({
        district_id: d.Id,
        district_name: d.Name
    }));
};

export const getWards = (districtId: string): Ward[] => {
    for (const province of rawData) {
        const district = province.Districts.find(d => d.Id === districtId);
        if (district) {
            return district.Wards.map(w => ({
                ward_id: w.Id,
                ward_name: w.Name
            }));
        }
    }
    return [];
};
