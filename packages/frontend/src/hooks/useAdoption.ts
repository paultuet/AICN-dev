import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import {
  AdoptionProgrammesData,
  AdoptionStatusData,
  ProgramRegistration,
  SubmitRegistrationInput,
} from "@/types/adoption";

const STATUS_KEY = ["adoption", "status"] as const;
const PROGRAMMES_KEY = ["adoption", "programmes"] as const;
const REGISTRATIONS_KEY = ["adoption", "registrations"] as const;

// Live Airtable proxy: keep it reasonably fresh but avoid a refetch on every
// mount. The "Rafraîchir" button forces a refetch regardless of staleness.
const STALE = 5 * 60 * 1000;

export const useAdoptionStatus = () =>
  useQuery({
    queryKey: STATUS_KEY,
    queryFn: async () => (await api.get<AdoptionStatusData>("/adoption/status")).data,
    staleTime: STALE,
  });

export const useAdoptionProgrammes = () =>
  useQuery({
    queryKey: PROGRAMMES_KEY,
    queryFn: async () =>
      (await api.get<AdoptionProgrammesData>("/adoption/programmes")).data,
    staleTime: STALE,
  });

export const useSubmitRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitRegistrationInput): Promise<ProgramRegistration> =>
      (await api.post<ProgramRegistration>("/adoption/registrations", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: REGISTRATIONS_KEY }),
  });
};

interface RegistrationsResponse {
  registrations: ProgramRegistration[];
}

export const useAdoptionRegistrations = () =>
  useQuery({
    queryKey: REGISTRATIONS_KEY,
    queryFn: async () =>
      (await api.get<RegistrationsResponse>("/adoption/registrations")).data
        .registrations ?? [],
  });
