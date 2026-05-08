type MapResult = {
  lat: number;
  lng: number;
  address?: string;
} | null;

let _result: MapResult = null;

export const mapResultStore = {
  get: (): MapResult => _result,
  set: (result: MapResult) => {
    _result = result;
  },
  clear: () => {
    _result = null;
  },
};
