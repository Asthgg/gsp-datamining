export const getInfo = "select s.fecha.$date, s.tipo_evento from S3Object[*][*] s";

export const eventId45 =  "select * from S3Object[*][*] s where s.tipo_evento in (5) ";

export const getDevices = `SELECT id_equipo as deviceId,
                                  nombre_equipo as name,
                                  nombre_empresa as company_name
                            FROM v60_api_public_equipos
                            WHERE ultima_fecha_reporte >= '2022-10-01 00:00:00' and 
                            nombre_empresa not in ('ALMACEN - LABORATORIO', 'ALMACEN - DESARROLLO') and 
                            nombre_equipo != 'Nuevo'`

export const gpsLocation = (index, date) => `SELECT h${index}.id,
                                h${index}.fecha as date,
                                h${index}.velocidad as speed,
                                h${index}.longitud as longitude,
                                h${index}.latitud as latitude,
                                h${index}.descripcion_novedad as description,
                                h${index}.direccion as direction
                                FROM vm5_historial_${date} h${index}
                                WHERE h${index}.id_equipo = $1
                                AND h${index}.fecha >= $2
                                AND h${index}.fecha <= $3 `;