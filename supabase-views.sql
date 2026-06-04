-- ============================================================
-- Wanconnect Portal — Supabase Views
-- Run this in Supabase SQL Editor (once only)
-- Each view creates a readable table per form type
-- ============================================================


-- ── 1. SEMINAR REGISTRATION ──────────────────────────────────
CREATE OR REPLACE VIEW v_seminar_registration AS
SELECT
  id,
  submitted_at,
  submitted_by,
  (data::jsonb->>'fullName')            AS full_name,
  (data::jsonb->>'email')               AS email,
  (data::jsonb->>'phone')               AS phone,
  (data::jsonb->>'department')          AS department,
  (data::jsonb->>'seminarName')         AS seminar_name,
  (data::jsonb->>'date')                AS seminar_date,
  (data::jsonb->>'dietaryRequirements') AS dietary_requirements,
  (data::jsonb->>'specialNeeds')        AS special_needs
FROM form_submissions
WHERE form_type = 'seminar_registration'
ORDER BY submitted_at DESC;


-- ── 2. STAFF CLAIM ───────────────────────────────────────────
CREATE OR REPLACE VIEW v_staff_claim AS
SELECT
  id,
  submitted_at,
  submitted_by,
  (data::jsonb->>'staffName')   AS staff_name,
  (data::jsonb->>'staffId')     AS staff_id,
  (data::jsonb->>'department')  AS department,
  (data::jsonb->>'claimType')   AS claim_type,
  (data::jsonb->>'amount')      AS amount,
  (data::jsonb->>'receiptDate') AS receipt_date,
  (data::jsonb->>'description') AS description,
  pdf_path                      AS receipt_file
FROM form_submissions
WHERE form_type = 'staff_claim'
ORDER BY submitted_at DESC;


-- ── 3. CLIENT REQUEST ────────────────────────────────────────
CREATE OR REPLACE VIEW v_client_request AS
SELECT
  id,
  submitted_at,
  submitted_by,
  (data::jsonb->>'clientName')  AS client_name,
  (data::jsonb->>'company')     AS company,
  (data::jsonb->>'email')       AS email,
  (data::jsonb->>'phone')       AS phone,
  (data::jsonb->>'requestType') AS request_type,
  (data::jsonb->>'priority')    AS priority,
  (data::jsonb->>'description') AS description
FROM form_submissions
WHERE form_type = 'client_request'
ORDER BY submitted_at DESC;


-- ── 4. JOB APPLICATION ───────────────────────────────────────
CREATE OR REPLACE VIEW v_job_application AS
SELECT
  id,
  submitted_at,
  submitted_by,
  -- Page 1: Personal Info
  (data::jsonb->>'nameNRIC')       AS full_name,
  (data::jsonb->>'email')          AS email,
  (data::jsonb->>'phoneNumber')    AS phone,
  (data::jsonb->>'applyingFor')    AS applying_for,
  (data::jsonb->>'branch')         AS branch,
  (data::jsonb->>'nric')           AS nric,
  (data::jsonb->>'dob')            AS date_of_birth,
  (data::jsonb->>'maritalStatus')  AS marital_status,
  (data::jsonb->>'religion')       AS religion,
  (data::jsonb->>'race')           AS race,
  (data::jsonb->>'homeAddress')    AS home_address,
  (data::jsonb->>'epf')            AS epf_number,
  (data::jsonb->>'socso')          AS socso_number,
  (data::jsonb->>'incomeTax')      AS income_tax_number,
  -- Page 2: Education
  (data::jsonb->>'highestEducation') AS highest_education,
  (data::jsonb->>'currentJobDesc')   AS current_job_desc,
  -- Raw JSON for complex nested fields (view in Supabase as JSON)
  (data::jsonb->'educationHistory')  AS education_history,
  (data::jsonb->'employmentHistory') AS employment_history,
  (data::jsonb->'familyDetails')     AS family_details,
  pdf_path                           AS application_pdf
FROM form_submissions
WHERE form_type = 'job_application'
ORDER BY submitted_at DESC;


-- ── 5. CUSTOM FORMS (all custom form submissions) ────────────
CREATE OR REPLACE VIEW v_custom_form_submissions AS
SELECT
  fs.id,
  fs.submitted_at,
  fs.submitted_by,
  fs.form_type,
  cf.name         AS form_name,
  cf.department,
  fs.data::jsonb  AS form_data
FROM form_submissions fs
LEFT JOIN custom_forms cf
  ON fs.form_type = 'custom_' || cf.id
WHERE fs.form_type LIKE 'custom_%'
ORDER BY fs.submitted_at DESC;


-- ── 6. ALL SUBMISSIONS OVERVIEW ──────────────────────────────
CREATE OR REPLACE VIEW v_all_submissions AS
SELECT
  id,
  submitted_at,
  submitted_by,
  form_type,
  CASE form_type
    WHEN 'job_application'      THEN 'Job Application'
    WHEN 'seminar_registration' THEN 'Seminar Registration'
    WHEN 'staff_claim'          THEN 'Staff Claim'
    WHEN 'client_request'       THEN 'Client Request'
    ELSE form_type
  END AS form_name,
  data::jsonb AS form_data
FROM form_submissions
ORDER BY submitted_at DESC;
