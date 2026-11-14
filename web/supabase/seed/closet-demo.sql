-- Clóset de ejemplo para la demo. NO es una migración: son datos de una sola cuenta.
-- Se pega en Supabase → SQL Editor. Se puede correr varias veces: borra y vuelve a crear solo las prendas demo.
--
-- A qué cuenta va: si hay una sola cuenta, a esa. Si hay más de una, escribe tu correo en `correo` (línea de abajo).
-- Fotos: las prendas quedan sin foto (se ve el marcador). Para que tengan foto, sube a Storage → user-media →
-- <tu user_id>/garments/ archivos JPEG llamados demo-01.jpg … demo-14.jpg (mismo orden que la lista).

do $$
declare
  correo text := '';            -- opcional: 'tu@correo.cl'
  uid uuid;
  total int;
begin
  if correo <> '' then
    select id into uid from auth.users where email = correo;
  else
    select count(*) into total from auth.users;
    if total = 1 then select id into uid from auth.users; end if;
  end if;
  if uid is null then
    raise exception 'No pude identificar la cuenta: escribe tu correo en la variable "correo".';
  end if;

  delete from public.garments where user_id = uid and photo_path like uid::text || '/garments/demo-%';

  insert into public.garments
    (user_id, photo_path, name, category, subcategory, colors, pattern, material, seasons, occasions, formality, brand, status, favorite)
  values
    (uid, uid::text || '/garments/demo-01.jpg', 'Camisa blanca de algodón', 'top', 'camisa',
      '[{"name":"blanco","hex":"#F5F3EE"}]', 'liso', 'algodón', '{verano,entretiempo,invierno}', '{trabajo,cena,evento}', 4, '', 'ready', true),
    (uid, uid::text || '/garments/demo-02.jpg', 'Polera gris básica', 'top', 'polera',
      '[{"name":"gris","hex":"#9A9A96"}]', 'liso', 'algodón', '{verano,entretiempo}', '{casual,fin de semana}', 2, '', 'ready', false),
    (uid, uid::text || '/garments/demo-03.jpg', 'Sweater azul marino', 'top', 'sweater',
      '[{"name":"azul marino","hex":"#1F2A44"}]', 'liso', 'lana merino', '{invierno,entretiempo}', '{trabajo,casual,cena}', 3, '', 'ready', true),
    (uid, uid::text || '/garments/demo-04.jpg', 'Camisa de lino celeste', 'top', 'camisa',
      '[{"name":"celeste","hex":"#A9C4DB"}]', 'liso', 'lino', '{verano,entretiempo}', '{casual,asado,evento}', 3, '', 'ready', false),
    (uid, uid::text || '/garments/demo-05.jpg', 'Polo verde oliva', 'top', 'polo',
      '[{"name":"verde oliva","hex":"#6B7355"}]', 'liso', 'piqué de algodón', '{verano,entretiempo}', '{casual,asado,fin de semana}', 3, '', 'ready', false),
    (uid, uid::text || '/garments/demo-06.jpg', 'Jeans azul oscuro rectos', 'bottom', 'jeans',
      '[{"name":"azul oscuro","hex":"#27344D"}]', 'liso', 'denim', '{verano,entretiempo,invierno}', '{casual,cena,fin de semana}', 2, '', 'ready', true),
    (uid, uid::text || '/garments/demo-07.jpg', 'Pantalón chino beige', 'bottom', 'chino',
      '[{"name":"beige","hex":"#CDB89A"}]', 'liso', 'gabardina', '{verano,entretiempo}', '{trabajo,asado,evento}', 3, '', 'ready', false),
    (uid, uid::text || '/garments/demo-08.jpg', 'Pantalón de vestir gris marengo', 'bottom', 'pantalón de vestir',
      '[{"name":"gris marengo","hex":"#4A4C52"}]', 'liso', 'lana', '{entretiempo,invierno}', '{trabajo,evento,matrimonio}', 4, '', 'ready', false),
    (uid, uid::text || '/garments/demo-09.jpg', 'Blazer azul marino', 'outerwear', 'blazer',
      '[{"name":"azul marino","hex":"#1F2A44"}]', 'liso', 'lana', '{entretiempo,invierno}', '{trabajo,evento,cena,matrimonio}', 4, '', 'ready', true),
    (uid, uid::text || '/garments/demo-10.jpg', 'Chaqueta de mezclilla', 'outerwear', 'chaqueta',
      '[{"name":"azul medio","hex":"#5A7494"}]', 'liso', 'denim', '{entretiempo}', '{casual,fin de semana}', 2, '', 'ready', false),
    (uid, uid::text || '/garments/demo-11.jpg', 'Parka negra', 'outerwear', 'parka',
      '[{"name":"negro","hex":"#1C1C1C"}]', 'liso', 'nylon', '{invierno}', '{casual,trabajo}', 2, '', 'ready', false),
    (uid, uid::text || '/garments/demo-12.jpg', 'Zapatillas blancas de cuero', 'shoes', 'zapatillas',
      '[{"name":"blanco","hex":"#F2F0EB"}]', 'liso', 'cuero', '{verano,entretiempo,invierno}', '{casual,fin de semana,asado}', 2, '', 'ready', true),
    (uid, uid::text || '/garments/demo-13.jpg', 'Mocasines café', 'shoes', 'mocasines',
      '[{"name":"café","hex":"#6B4A32"}]', 'liso', 'cuero', '{verano,entretiempo}', '{trabajo,cena,evento}', 4, '', 'ready', false),
    (uid, uid::text || '/garments/demo-14.jpg', 'Cinturón de cuero café', 'accessory', 'cinturón',
      '[{"name":"café","hex":"#6B4A32"}]', 'liso', 'cuero', '{verano,entretiempo,invierno}', '{trabajo,cena,evento}', 3, '', 'ready', false);
end $$;
