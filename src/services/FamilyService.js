import { API_ENDPOINTS, apiCall } from "./api";

const getFamilyMembers = async (token) => {
  const { data, error } = await apiCall(
    API_ENDPOINTS.FAMILY.MEMBERS,
    "GET",
    null,
    token,
  );

  if (error) return { success: false, error };
  return { success: true, data };
};

// ─── POST /api/family/invite ──────────────────────────────────────────
/**
 * Envoie une invitation par email
 * ⚠️  Requiert JWT (Occupant uniquement)
 *
 * @param {string} email  - email du membre à inviter
 * @param {string} token  - JWT token
 * Retourne: { message: "Invitation sent successfully..." }
 */
const inviteMember = async (email, token) => {
  const { data, error } = await apiCall(
    API_ENDPOINTS.FAMILY.INVITE,
    "POST",
    { email: email.trim().toLowerCase() },
    token,
  );

  if (error) return { success: false, error };
  return { success: true, message: data?.message };
};

// ─── DELETE /api/family/members/:id ──────────────────────────────────
/**
 * Révoque un membre actif ou annule une invitation
 * ⚠️  Requiert JWT (Occupant uniquement)
 *
 * @param {number} memberId
 * @param {string} token  - JWT token
 */
const revokeMember = async (memberId, token) => {
  const { data, error } = await apiCall(
    `${API_ENDPOINTS.FAMILY.MEMBERS}/${memberId}`,
    "DELETE",
    null,
    token,
  );

  if (error) return { success: false, error };
  return { success: true, message: data?.message };
};

// ─── GET /api/family/validate-token?token= ───────────────────────────
/**
 * Valide un token d'invitation (pas besoin de JWT)
 * Utilisé sur la page d'acceptation
 * Retourne: { valid: true, email }
 */
const validateInvitationToken = async (invitationToken) => {
  const { data, error } = await apiCall(
    `${API_ENDPOINTS.FAMILY.VALIDATE_TOKEN}?token=${invitationToken}`,
    "GET",
  );

  if (error) return { valid: false, error };
  return { valid: true, email: data?.email };
};

// ─── POST /api/family/accept-invitation ──────────────────────────────
/**
 * Accepte une invitation et crée le compte FamilyMember
 * Pas besoin de JWT
 *
 * @param {{ token, firstName, lastName, phoneNumber, passwordHash }} dto
 * passwordHash = mot de passe en clair (le backend hash avec BCrypt)
 */
const acceptInvitation = async (dto) => {
  const { data, error } = await apiCall(
    API_ENDPOINTS.FAMILY.ACCEPT_INVITATION,
    "POST",
    {
      token: dto.token,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phoneNumber: dto.phoneNumber?.trim() || "",
      passwordHash: dto.password, // backend attend "passwordHash" = mot de passe clair
    },
  );

  if (error) return { success: false, error };
  return { success: true, message: data?.message };
};

export const familyService = {
  getFamilyMembers,
  inviteMember,
  revokeMember,
  validateInvitationToken,
  acceptInvitation,
};
