import axios from "axios";
import { TravelaRestrictionResponse } from "../types/travela.type";

export const travelaApiService = {
  async getRestrictions(listingId: string | number): Promise<TravelaRestrictionResponse> {
    const response = await axios.get(
      `https://api.travela.xyz/api/restriction?listing=${listingId}`
    );
    return response.data;
  },
};

