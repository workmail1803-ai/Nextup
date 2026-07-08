-- =====================================================
-- NextUp Mentor — Client CRM seed (imported from TSV exports)
-- Migration 0004. Run after 0003. Idempotent (fixed UUIDs).
-- Generated from the real Client Meeting + VFS sheets.
-- =====================================================

-- Consultants (mentors) as staff rows
INSERT INTO staff (full_name, staff_code, title, status) SELECT 'Fahim', 'NX-2001', 'Founder & Consultant', 'active' WHERE NOT EXISTS (SELECT 1 FROM staff WHERE upper(staff_code) = 'NX-2001');
INSERT INTO staff (full_name, staff_code, title, status) SELECT 'Avijit', 'NX-2002', 'Consultant', 'active' WHERE NOT EXISTS (SELECT 1 FROM staff WHERE upper(staff_code) = 'NX-2002');
INSERT INTO staff (full_name, staff_code, title, status) SELECT 'Sourish', 'NX-2003', 'Consultant', 'active' WHERE NOT EXISTS (SELECT 1 FROM staff WHERE upper(staff_code) = 'NX-2003');

-- Romjan Mia
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'add53a56-2798-5715-8d18-c8ac365dccbb', 'Romjan Mia', ARRAY['Lithuania']::text[], 'bachelors'::degree_level, NULL, 'Romjan Mia', '1407681551', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'add53a56-2798-5715-8d18-c8ac365dccbb');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'add53a56-2798-5715-8d18-c8ac365dccbb', TIMESTAMPTZ '2026-06-05 11:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'Follow Up ( Bashay kotha bole janasse, eksathe 2ta file )', '08/09 tarik e call follow up', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'add53a56-2798-5715-8d18-c8ac365dccbb');

-- Ahnaf Mahir
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '4e0b44fb-79eb-5bf4-be6c-6abd77b0987f', 'Ahnaf Mahir', ARRAY['Lithuania']::text[], 'bachelors'::degree_level, NULL, NULL, '1710016465', 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '4e0b44fb-79eb-5bf4-be6c-6abd77b0987f');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '4e0b44fb-79eb-5bf4-be6c-6abd77b0987f', TIMESTAMPTZ '2026-06-06 03:00:00+06', NULL, NULL, 'scheduled'::meeting_status, 'Didnt join the meeting, trying for another schedule', 'Didnt receive. Follow up', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '4e0b44fb-79eb-5bf4-be6c-6abd77b0987f');

-- Ishaan
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '0d6da596-932f-50b4-9325-a80ed13e0c66', 'Ishaan', ARRAY['Italy']::text[], NULL, NULL, NULL, '1855638497', 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '0d6da596-932f-50b4-9325-a80ed13e0c66');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '0d6da596-932f-50b4-9325-a80ed13e0c66', TIMESTAMPTZ '2023-06-07 11:30:00+06', NULL, NULL, 'scheduled'::meeting_status, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '0d6da596-932f-50b4-9325-a80ed13e0c66');

-- Lajuk
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '448ce5c4-df90-58df-b14e-13eef89a8f44', 'Lajuk', ARRAY['Italy','Lithuania']::text[], NULL, 'lajuk671270@gmail.com', NULL, '1608082179', 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '448ce5c4-df90-58df-b14e-13eef89a8f44');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '448ce5c4-df90-58df-b14e-13eef89a8f44', TIMESTAMPTZ '2023-06-07 04:30:00+06', NULL, NULL, 'scheduled'::meeting_status, 'Didnt join the meeting, trying for another schedule', 'Next kokhn join korte pare msg kore janabe', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '448ce5c4-df90-58df-b14e-13eef89a8f44');

-- Masroor Ahmad
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'a0668d39-5567-5a20-8c8e-768c1891aea6', 'Masroor Ahmad', ARRAY['Italy']::text[], NULL, 'ahmadmasroor.edu@gmail.com', 'Masroor Ahmad', '1947607941', 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'a0668d39-5567-5a20-8c8e-768c1891aea6');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'a0668d39-5567-5a20-8c8e-768c1891aea6', TIMESTAMPTZ '2023-06-07 07:30:00+06', NULL, NULL, 'scheduled'::meeting_status, 'Joined, after 1 week need to take update', 'decision nei ni, nile janabe', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'a0668d39-5567-5a20-8c8e-768c1891aea6');

-- Mahfujul h piyal
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '6eaec81f-0038-5ba8-bdb8-25dc829dfce1', 'Mahfujul h piyal', ARRAY['Italy','Lithuania']::text[], 'masters'::degree_level, 'mahfujulhpiyal@gmail.com', 'Piyal Irtehan', '1883306102', 'file_open'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '6eaec81f-0038-5ba8-bdb8-25dc829dfce1');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '6eaec81f-0038-5ba8-bdb8-25dc829dfce1', TIMESTAMPTZ '2026-06-07 22:30:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit', 'scheduled'::meeting_status, 'File Opening Charge Payment Done', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '6eaec81f-0038-5ba8-bdb8-25dc829dfce1');

-- MD Shariar Faruque Bhuiyan
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '1d2d6782-51f1-54fc-b40d-78c72f55e55b', 'MD Shariar Faruque Bhuiyan', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, 'MD Shariar Faruque Bhuiyan', NULL, 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '1d2d6782-51f1-54fc-b40d-78c72f55e55b');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '1d2d6782-51f1-54fc-b40d-78c72f55e55b', TIMESTAMPTZ '2026-06-08 11:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit', 'scheduled'::meeting_status, 'Porsu abr meeting ache. Lithunia neai jante chai, Fahim k oi meeting e tkhte hbe. Appliacnt er uncle o join krbe', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '1d2d6782-51f1-54fc-b40d-78c72f55e55b');

-- Ray Han
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '6024863c-bc29-5166-a3e6-66c5575e8329', 'Ray Han', ARRAY['Italy']::text[], 'masters'::degree_level, NULL, 'Ray Han', '1990425423', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '6024863c-bc29-5166-a3e6-66c5575e8329');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '6024863c-bc29-5166-a3e6-66c5575e8329', TIMESTAMPTZ '2026-06-08 16:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit', 'scheduled'::meeting_status, 'Within running week janabe, follow up in 5days', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '6024863c-bc29-5166-a3e6-66c5575e8329');

-- Bishal Shill
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '76a92881-0262-5866-a0ed-0b90cc552dd0', 'Bishal Shill', ARRAY['Lithuania']::text[], NULL, 'bishal.shill.fpe@gmail.com', NULL, '1753492239', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '76a92881-0262-5866-a0ed-0b90cc552dd0');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '76a92881-0262-5866-a0ed-0b90cc552dd0', TIMESTAMPTZ '2026-06-10 20:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '76a92881-0262-5866-a0ed-0b90cc552dd0');

-- Ishaan Alam
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '5bcb96db-0106-50fd-a3b8-7a40246354cb', 'Ishaan Alam', ARRAY['Italy']::text[], 'bachelors'::degree_level, 'isratalamishaan64@gmail.com', NULL, '1855638497', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2003' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '5bcb96db-0106-50fd-a3b8-7a40246354cb');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '5bcb96db-0106-50fd-a3b8-7a40246354cb', TIMESTAMPTZ '2026-06-09 04:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2003' LIMIT 1), 'Sourish', 'scheduled'::meeting_status, 'basai kotha bole janabe, call diye jigges kora hobe, follow up in 5days', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '5bcb96db-0106-50fd-a3b8-7a40246354cb');

-- Shanjida Oishee
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '97ea0509-6d86-5f71-aa45-005de766b8f6', 'Shanjida Oishee', ARRAY['Lithuania']::text[], 'masters'::degree_level, 'shanjidaoishee2@gmail.com', 'Shanjida Oishee', '601162397176', 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '97ea0509-6d86-5f71-aa45-005de766b8f6');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '97ea0509-6d86-5f71-aa45-005de766b8f6', TIMESTAMPTZ '2026-06-09 05:00:00+06', NULL, NULL, 'scheduled'::meeting_status, 'not sure what to do, basai kotha bole janabe. follow up in 5 days', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '97ea0509-6d86-5f71-aa45-005de766b8f6');

-- Sumaiya Rahim Rimu
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '9b08ef1d-2e1b-5308-9a6c-89fa91f0f6bc', 'Sumaiya Rahim Rimu', ARRAY['Italy']::text[], 'masters'::degree_level, 'rahimsumaiya590@gmail.com', NULL, '1721629470', 'file_open'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '9b08ef1d-2e1b-5308-9a6c-89fa91f0f6bc');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '9b08ef1d-2e1b-5308-9a6c-89fa91f0f6bc', TIMESTAMPTZ '2026-06-03 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'File Opening Charge Payment Done', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '9b08ef1d-2e1b-5308-9a6c-89fa91f0f6bc');

-- Farhana Ahmed Munmun
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '6c2669f4-4f51-59f2-b5dd-a9cd6835946e', 'Farhana Ahmed Munmun', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, 'Farhana Ahmed Munmun', NULL, 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '6c2669f4-4f51-59f2-b5dd-a9cd6835946e');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '6c2669f4-4f51-59f2-b5dd-a9cd6835946e', TIMESTAMPTZ '2026-06-08 20:30:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'Again Kotha hwar kotha cilo. But uni join kren ne. Again msg debo kal', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '6c2669f4-4f51-59f2-b5dd-a9cd6835946e');

-- Siam Bin Ali
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '22ecdd9a-1001-5c6e-9543-f5f17f12f894', 'Siam Bin Ali', ARRAY['Lithuania','Italy']::text[], 'masters'::degree_level, 'alinibir9@gmail.com', 'Siam Bin Ali', '1791404003', 'file_open'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '22ecdd9a-1001-5c6e-9543-f5f17f12f894');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '22ecdd9a-1001-5c6e-9543-f5f17f12f894', TIMESTAMPTZ '2026-06-10 06:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'Lithuania+italy both krbe, Ielts 8, cimea and all for italy done, file open 5, after offer 35, after vissa 1.60lakh', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '22ecdd9a-1001-5c6e-9543-f5f17f12f894');

-- Sadia Kabir Smrety
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '4f58593d-91d2-5fec-bb9a-e45bcbb889e9', 'Sadia Kabir Smrety', ARRAY['Italy']::text[], 'masters'::degree_level, NULL, 'Sadia Kabir Smrety', '1775157556', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '4f58593d-91d2-5fec-bb9a-e45bcbb889e9');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '4f58593d-91d2-5fec-bb9a-e45bcbb889e9', TIMESTAMPTZ '2026-07-02 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Avijit/After follow up Fahim', 'scheduled'::meeting_status, 'basay kotha bole janabe', NULL, 'thursday 3pm meeting e asbe', 'Current geche, job kore, amader janabe, again follow up'
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '4f58593d-91d2-5fec-bb9a-e45bcbb889e9');

-- Md Yeakub
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'b3536f26-583c-5aa2-a2a6-90e19b13ba12', 'Md Yeakub', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, 'Md Yeakub', '1734-481284', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'b3536f26-583c-5aa2-a2a6-90e19b13ba12');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'b3536f26-583c-5aa2-a2a6-90e19b13ba12', TIMESTAMPTZ '2026-07-02 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Avijit/After follow up Fahim', 'scheduled'::meeting_status, 'basay kotha bole janabe', NULL, 'thursday 7pm meeting e asbe', 'followup niye lav nai, information nea sele, only nij theke contact krle ktha blbo'
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'b3536f26-583c-5aa2-a2a6-90e19b13ba12');

-- Jubayer
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'deb97e14-20af-5596-a6ef-a435248ebe12', 'Jubayer', ARRAY['Italy']::text[], 'masters'::degree_level, 'jk8600689@gmail.com', NULL, '1937686426', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'deb97e14-20af-5596-a6ef-a435248ebe12');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'deb97e14-20af-5596-a6ef-a435248ebe12', TIMESTAMPTZ '2026-06-12 15:30:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'deb97e14-20af-5596-a6ef-a435248ebe12');

-- Zubair Rafiq
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '5764116d-8918-5242-aebb-b5d07ec741cb', 'Zubair Rafiq', ARRAY['Italy']::text[], 'masters'::degree_level, NULL, 'Zubair Rafiq', NULL, 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '5764116d-8918-5242-aebb-b5d07ec741cb');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '5764116d-8918-5242-aebb-b5d07ec741cb', TIMESTAMPTZ '2026-06-13 11:30:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit', 'scheduled'::meeting_status, 'Shortly Update Janabe', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '5764116d-8918-5242-aebb-b5d07ec741cb');

-- Md Shazzad Hoshain
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'a2d9d2bd-a0ea-55d3-b878-802ed1ff372d', 'Md Shazzad Hoshain', ARRAY['Italy']::text[], 'masters'::degree_level, 'shazzad01929@gmail.com', NULL, '1943121742', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'a2d9d2bd-a0ea-55d3-b878-802ed1ff372d');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'a2d9d2bd-a0ea-55d3-b878-802ed1ff372d', TIMESTAMPTZ '2026-06-15 20:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit', 'scheduled'::meeting_status, 'dui din er modhha janabe', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'a2d9d2bd-a0ea-55d3-b878-802ed1ff372d');

-- Shahriar Ahmed Shimul
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'a59cee85-0b30-5c39-a991-3b65a0681dd8', 'Shahriar Ahmed Shimul', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, 'Shahriar Ahmed Shimul', '1646170533', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'a59cee85-0b30-5c39-a991-3b65a0681dd8');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'a59cee85-0b30-5c39-a991-3b65a0681dd8', TIMESTAMPTZ '2026-06-20 21:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit+Sourish', 'scheduled'::meeting_status, 'Update janabe bolche basai kotha bola', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'a59cee85-0b30-5c39-a991-3b65a0681dd8');

-- Jakaria Islam
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '7140fd6a-d970-5cfd-82d7-d138e9eaafff', 'Jakaria Islam', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, 'Jakaria Islam', NULL, 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '7140fd6a-d970-5cfd-82d7-d138e9eaafff');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '7140fd6a-d970-5cfd-82d7-d138e9eaafff', TIMESTAMPTZ '2026-06-20 22:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit+Sourish', 'scheduled'::meeting_status, 'Financial Condition vlo nah', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '7140fd6a-d970-5cfd-82d7-d138e9eaafff');

-- Seam Ahmed
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '146b3ef4-6eac-536c-901f-33542f9ab42f', 'Seam Ahmed', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, 'Seam Ahmed', NULL, 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '146b3ef4-6eac-536c-901f-33542f9ab42f');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '146b3ef4-6eac-536c-901f-33542f9ab42f', TIMESTAMPTZ '2026-06-23 22:30:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit', 'scheduled'::meeting_status, 'Update janabe bolche basai kotha bola', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '146b3ef4-6eac-536c-901f-33542f9ab42f');

-- Riaz Mahamud
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '154d46b5-b483-56f9-8158-84a2ecfd7f54', 'Riaz Mahamud', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, NULL, '1681306277', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '154d46b5-b483-56f9-8158-84a2ecfd7f54');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '154d46b5-b483-56f9-8158-84a2ecfd7f54', TIMESTAMPTZ '2026-06-25 22:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2002' LIMIT 1), 'Avijit', 'scheduled'::meeting_status, 'IELTS Teacher from Cumilla (aj 10.00 PM e again meeting ache)', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '154d46b5-b483-56f9-8158-84a2ecfd7f54');

-- Meherun
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '67ae6b9d-d5ed-597f-aa9d-e8ae986513ed', 'Meherun', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, NULL, '1842726594', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '67ae6b9d-d5ed-597f-aa9d-e8ae986513ed');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '67ae6b9d-d5ed-597f-aa9d-e8ae986513ed', TIMESTAMPTZ '2026-07-02 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Avijit/After follow up Fahim', 'scheduled'::meeting_status, 'Aj 5.00 PM Meeting ache', NULL, 'thursday 8pm meeting e asbe', 'No further response, no follow up needed'
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '67ae6b9d-d5ed-597f-aa9d-e8ae986513ed');

-- al rafi hawladar
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'c35579c3-1387-5d7f-86df-d17b9861c4c3', 'al rafi hawladar', ARRAY['Lithuania']::text[], NULL, 'rafihowlader999@gmail.com', NULL, '1936027283', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'c35579c3-1387-5d7f-86df-d17b9861c4c3');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'c35579c3-1387-5d7f-86df-d17b9861c4c3', TIMESTAMPTZ '2026-07-02 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, NULL, NULL, 'thursday 6:30pm meeting e asbe', 'Rat 10tar dik knk dibe abr'
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'c35579c3-1387-5d7f-86df-d17b9861c4c3');

-- abrar fahim
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'fc34a782-6a15-53c9-a062-38b797686d11', 'abrar fahim', ARRAY['Lithuania','Italy']::text[], NULL, 'abrarfahim8iut-dhaka.edu', NULL, '1855891232', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'fc34a782-6a15-53c9-a062-38b797686d11');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'fc34a782-6a15-53c9-a062-38b797686d11', TIMESTAMPTZ '2026-07-02 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, NULL, NULL, 'thursday 8:30 pm', 'Kaj krbe bole mon a hocche still now, ktha hocche'
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'fc34a782-6a15-53c9-a062-38b797686d11');

-- Zedanul Kabir Zedan
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '4673f63d-fff8-5180-90cc-36f56a377198', 'Zedanul Kabir Zedan', ARRAY['Italy']::text[], NULL, 'zedanulk@gmail.com', NULL, '1835369610', 'file_open'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '4673f63d-fff8-5180-90cc-36f56a377198');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '4673f63d-fff8-5180-90cc-36f56a377198', TIMESTAMPTZ '2026-07-03 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'File Opening done', NULL, 'friday 3 pm', NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '4673f63d-fff8-5180-90cc-36f56a377198');

-- Ranobir limart
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '9d46074b-de96-5d52-9dcc-a4bfa921871b', 'Ranobir limart', ARRAY['Italy']::text[], 'bachelors'::degree_level, 'limartranabir92@gmail.com', 'Rana bir', '1580926782', 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '9d46074b-de96-5d52-9dcc-a4bfa921871b');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '9d46074b-de96-5d52-9dcc-a4bfa921871b', TIMESTAMPTZ '2026-07-02 00:00:00+06', NULL, NULL, 'scheduled'::meeting_status, '2-1 diner moddhe janabe', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '9d46074b-de96-5d52-9dcc-a4bfa921871b');

-- Rahin intesar nafim
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '52d0a954-2642-5182-a493-9defb1049f65', 'Rahin intesar nafim', '{}', NULL, NULL, NULL, NULL, 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '52d0a954-2642-5182-a493-9defb1049f65');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '52d0a954-2642-5182-a493-9defb1049f65', NULL, NULL, NULL, 'scheduled'::meeting_status, 'future cimea candidate', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '52d0a954-2642-5182-a493-9defb1049f65');

-- Md Mahatir
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '561e8b0e-ccbf-550f-bcd2-23339eebd46d', 'Md Mahatir', ARRAY['Lithuania']::text[], 'bachelors'::degree_level, NULL, NULL, NULL, 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '561e8b0e-ccbf-550f-bcd2-23339eebd46d');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '561e8b0e-ccbf-550f-bcd2-23339eebd46d', TIMESTAMPTZ '2026-07-03 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'need to check for feb', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '561e8b0e-ccbf-550f-bcd2-23339eebd46d');

-- Nishita Das
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT 'd537358f-1e39-5914-95bb-075b38d3cf32', 'Nishita Das', ARRAY['Italy']::text[], 'masters'::degree_level, NULL, NULL, '131788 2066', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'd537358f-1e39-5914-95bb-075b38d3cf32');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT 'd537358f-1e39-5914-95bb-075b38d3cf32', TIMESTAMPTZ '2026-07-03 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'Follow up must', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = 'd537358f-1e39-5914-95bb-075b38d3cf32');

-- Sheam Mahmud
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '88173316-7328-5f72-aee1-7085de0410fd', 'Sheam Mahmud', ARRAY['Lithuania']::text[], 'masters'::degree_level, NULL, NULL, '1709612824', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '88173316-7328-5f72-aee1-7085de0410fd');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '88173316-7328-5f72-aee1-7085de0410fd', TIMESTAMPTZ '2026-07-03 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'Follow up must', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '88173316-7328-5f72-aee1-7085de0410fd');

-- Md Jesan
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '4640149a-4995-5386-b738-fe0ecce0c0c5', 'Md Jesan', ARRAY['Lithuania','Italy']::text[], 'bachelors'::degree_level, NULL, NULL, '1884912153', 'meeting'::client_stage, (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '4640149a-4995-5386-b738-fe0ecce0c0c5');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '4640149a-4995-5386-b738-fe0ecce0c0c5', TIMESTAMPTZ '2026-07-03 00:00:00+06', (SELECT id FROM staff WHERE upper(staff_code) = 'NX-2001' LIMIT 1), 'Fahim', 'scheduled'::meeting_status, 'Follow up must', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '4640149a-4995-5386-b738-fe0ecce0c0c5');

-- Sara
INSERT INTO clients (id, full_name, country_interest, degree, email, facebook_id, whatsapp, stage, primary_consultant_id, notes)
SELECT '2653f675-744a-5b30-8fbb-b92659bf242e', 'Sara', ARRAY['Italy']::text[], 'bachelors'::degree_level, NULL, NULL, NULL, 'meeting'::client_stage, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '2653f675-744a-5b30-8fbb-b92659bf242e');
INSERT INTO client_meetings (client_id, scheduled_at, consultant_id, consultant_raw, status, comments, reminder, follow_up_comments, follow_up_note)
SELECT '2653f675-744a-5b30-8fbb-b92659bf242e', TIMESTAMPTZ '2026-07-03 00:00:00+06', NULL, NULL, 'scheduled'::meeting_status, 'Follow up must', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM client_meetings WHERE client_id = '2653f675-744a-5b30-8fbb-b92659bf242e');

-- VFS / visa-stage clients
-- VISA: Sanaul Haque
INSERT INTO clients (id, full_name, stage, notes)
SELECT '29011d3a-1064-5a0c-a017-35e390904342', 'Sanaul Haque', 'visa'::client_stage, 'Imported from VFS appointment sheet'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '29011d3a-1064-5a0c-a017-35e390904342');
INSERT INTO client_visa (id, client_id, vfs_appointment_date, status)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', '29011d3a-1064-5a0c-a017-35e390904342', DATE '2026-07-16', 'collecting'::visa_status
WHERE NOT EXISTS (SELECT 1 FROM client_visa WHERE id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Valid Passport', 'pending'::visa_doc_status, 1
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Valid Passport');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Passport-size Photographs', 'pending'::visa_doc_status, 2
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Passport-size Photographs');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'University Offer / Admission Letter', 'pending'::visa_doc_status, 3
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'University Offer / Admission Letter');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Bank Statement / Financial Proof', 'pending'::visa_doc_status, 4
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Bank Statement / Financial Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Sponsorship / Affidavit of Support', 'pending'::visa_doc_status, 5
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Sponsorship / Affidavit of Support');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'IELTS / Language Certificate', 'pending'::visa_doc_status, 6
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'IELTS / Language Certificate');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Academic Transcripts & Certificates', 'pending'::visa_doc_status, 7
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Academic Transcripts & Certificates');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Accommodation Proof', 'pending'::visa_doc_status, 8
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Accommodation Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Health / Travel Insurance', 'pending'::visa_doc_status, 9
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Health / Travel Insurance');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63', 'Completed Visa Application Form', 'pending'::visa_doc_status, 10
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'bf8e6319-7e35-5e85-8c99-e543e1b8fc63' AND document_name = 'Completed Visa Application Form');

-- VISA: srijon
INSERT INTO clients (id, full_name, stage, notes)
SELECT '96051b02-fee3-510d-9cc3-f647ac1ebbf8', 'srijon', 'visa'::client_stage, 'Imported from VFS appointment sheet'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '96051b02-fee3-510d-9cc3-f647ac1ebbf8');
INSERT INTO client_visa (id, client_id, vfs_appointment_date, status)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', '96051b02-fee3-510d-9cc3-f647ac1ebbf8', DATE '2026-07-23', 'collecting'::visa_status
WHERE NOT EXISTS (SELECT 1 FROM client_visa WHERE id = 'd2161596-e3b0-5414-9308-a44157882876');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Valid Passport', 'pending'::visa_doc_status, 1
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Valid Passport');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Passport-size Photographs', 'pending'::visa_doc_status, 2
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Passport-size Photographs');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'University Offer / Admission Letter', 'pending'::visa_doc_status, 3
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'University Offer / Admission Letter');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Bank Statement / Financial Proof', 'pending'::visa_doc_status, 4
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Bank Statement / Financial Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Sponsorship / Affidavit of Support', 'pending'::visa_doc_status, 5
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Sponsorship / Affidavit of Support');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'IELTS / Language Certificate', 'pending'::visa_doc_status, 6
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'IELTS / Language Certificate');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Academic Transcripts & Certificates', 'pending'::visa_doc_status, 7
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Academic Transcripts & Certificates');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Accommodation Proof', 'pending'::visa_doc_status, 8
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Accommodation Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Health / Travel Insurance', 'pending'::visa_doc_status, 9
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Health / Travel Insurance');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'd2161596-e3b0-5414-9308-a44157882876', 'Completed Visa Application Form', 'pending'::visa_doc_status, 10
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'd2161596-e3b0-5414-9308-a44157882876' AND document_name = 'Completed Visa Application Form');

-- VISA: Dipanto
INSERT INTO clients (id, full_name, stage, notes)
SELECT 'd73b960d-df98-514b-bdf5-218cd1d28e3a', 'Dipanto', 'visa'::client_stage, 'Imported from VFS appointment sheet'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = 'd73b960d-df98-514b-bdf5-218cd1d28e3a');
INSERT INTO client_visa (id, client_id, vfs_appointment_date, status)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'd73b960d-df98-514b-bdf5-218cd1d28e3a', DATE '2026-07-12', 'collecting'::visa_status
WHERE NOT EXISTS (SELECT 1 FROM client_visa WHERE id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Valid Passport', 'pending'::visa_doc_status, 1
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Valid Passport');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Passport-size Photographs', 'pending'::visa_doc_status, 2
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Passport-size Photographs');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'University Offer / Admission Letter', 'pending'::visa_doc_status, 3
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'University Offer / Admission Letter');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Bank Statement / Financial Proof', 'pending'::visa_doc_status, 4
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Bank Statement / Financial Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Sponsorship / Affidavit of Support', 'pending'::visa_doc_status, 5
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Sponsorship / Affidavit of Support');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'IELTS / Language Certificate', 'pending'::visa_doc_status, 6
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'IELTS / Language Certificate');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Academic Transcripts & Certificates', 'pending'::visa_doc_status, 7
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Academic Transcripts & Certificates');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Accommodation Proof', 'pending'::visa_doc_status, 8
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Accommodation Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Health / Travel Insurance', 'pending'::visa_doc_status, 9
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Health / Travel Insurance');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895', 'Completed Visa Application Form', 'pending'::visa_doc_status, 10
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = 'e8ce4f51-7403-5a6e-b6d6-cb104b2c5895' AND document_name = 'Completed Visa Application Form');

-- VISA: Reason
INSERT INTO clients (id, full_name, stage, notes)
SELECT '34d52555-f8c9-551f-b6ec-cc3b4376cbd1', 'Reason', 'visa'::client_stage, 'Imported from VFS appointment sheet'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE id = '34d52555-f8c9-551f-b6ec-cc3b4376cbd1');
INSERT INTO client_visa (id, client_id, vfs_appointment_date, status)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', '34d52555-f8c9-551f-b6ec-cc3b4376cbd1', DATE '2026-08-25', 'collecting'::visa_status
WHERE NOT EXISTS (SELECT 1 FROM client_visa WHERE id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Valid Passport', 'pending'::visa_doc_status, 1
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Valid Passport');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Passport-size Photographs', 'pending'::visa_doc_status, 2
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Passport-size Photographs');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'University Offer / Admission Letter', 'pending'::visa_doc_status, 3
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'University Offer / Admission Letter');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Bank Statement / Financial Proof', 'pending'::visa_doc_status, 4
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Bank Statement / Financial Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Sponsorship / Affidavit of Support', 'pending'::visa_doc_status, 5
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Sponsorship / Affidavit of Support');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'IELTS / Language Certificate', 'pending'::visa_doc_status, 6
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'IELTS / Language Certificate');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Academic Transcripts & Certificates', 'pending'::visa_doc_status, 7
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Academic Transcripts & Certificates');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Accommodation Proof', 'pending'::visa_doc_status, 8
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Accommodation Proof');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Health / Travel Insurance', 'pending'::visa_doc_status, 9
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Health / Travel Insurance');
INSERT INTO visa_document_items (visa_id, document_name, status, sort_order)
SELECT '1d0b47c2-80fa-5bbe-842e-0df34119c0c8', 'Completed Visa Application Form', 'pending'::visa_doc_status, 10
WHERE NOT EXISTS (SELECT 1 FROM visa_document_items WHERE visa_id = '1d0b47c2-80fa-5bbe-842e-0df34119c0c8' AND document_name = 'Completed Visa Application Form');
