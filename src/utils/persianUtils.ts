// Persian Utility Functions

export const toPersianDigits = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
};

export const formatDistance = (distKm: number): string => {
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return `${toPersianDigits(meters)} متر`;
  }
  return `${toPersianDigits(distKm.toFixed(1))} کیلومتر`;
};

// Calculate distance between two coordinates in kilometers using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Dezful Default Center Coordinates
export const DEZFUL_CENTER_COORDS: [number, number] = [32.3835, 48.4005];

// Map Links
export const getNavigationLinks = (lat: number, lng: number, placeName: string) => {
  const encodedName = encodeURIComponent(placeName);
  return {
    neshan: `https://neshan.org/maps/@${lat},${lng},17z?q=${encodedName}`,
    balad: `https://balad.ir/location?latitude=${lat}&longitude=${lng}`,
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  };
};

export const getPlaceTypeName = (type: string): string => {
  switch (type) {
    case 'historic_mosque':
      return 'مسجد تاریخی';
    case 'mosque':
      return 'مسجد';
    case 'hussainiya':
      return 'حسینیه';
    case 'shrine':
      return 'آستانه و بقعه';
    default:
      return 'مکان مذهبی';
  }
};

export const getNeighborhoodCategoryName = (cat: string): string => {
  switch (cat) {
    case 'historic':
      return 'بافت تاریخی و شوادون‌ها';
    case 'bazaar_center':
      return 'مرکز شهر و بازار';
    case 'old_quarters':
      return 'محلات سنتی و قدیمی';
    case 'new_towns':
      return 'کوی‌ها و مناطق جدید';
    default:
      return 'محله';
  }
};

export interface NextPrayerInfo {
  name: string;
  time: string;
  label: string;
}

export const getNextPrayerInfo = (prayerTimes?: { fajr?: string; dhuhr?: string; maghrib?: string }): NextPrayerInfo => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Default times for Dezful in minutes
  const fajrMin = 5 * 60 + 15; // 05:15
  const dhuhrMin = 13 * 60 + 15; // 13:15
  const maghribMin = 19 * 60 + 45; // 19:45

  const fajrStr = prayerTimes?.fajr || '۰۵:۱۵';
  const dhuhrStr = prayerTimes?.dhuhr || '۱۳:۱۵';
  const maghribStr = prayerTimes?.maghrib || '۱۹:۴۵';

  if (currentMinutes < fajrMin) {
    return {
      name: 'صبح',
      time: fajrStr,
      label: `نماز صبح (${fajrStr})`,
    };
  } else if (currentMinutes < dhuhrMin) {
    return {
      name: 'ظهر و عصر',
      time: dhuhrStr,
      label: `نماز ظهر و عصر (${dhuhrStr})`,
    };
  } else if (currentMinutes < maghribMin) {
    return {
      name: 'مغرب و عشاء',
      time: maghribStr,
      label: `نماز مغرب و عشاء (${maghribStr})`,
    };
  } else {
    return {
      name: 'صبح فردا',
      time: fajrStr,
      label: `نماز صبح فردا (${fajrStr})`,
    };
  }
};

