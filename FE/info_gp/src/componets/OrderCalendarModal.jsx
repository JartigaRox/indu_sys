import { useState, useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../calendar-styles.css';
import 'moment/locale/es';
import OrderDetailModal from './OrderDetailModal';

// Configurar moment en español
moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
  weekdaysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
  weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sá'.split('_')
});

const localizer = momentLocalizer(moment);

const OrderCalendarModal = ({ show, onHide, orders }) => {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  // Convertir órdenes a eventos del calendario
  const events = useMemo(() => {
    if (!orders) return [];
    
    return orders
      .filter(order => order.FechaEntrega && order.EstadoNombre !== 'Pagado y finalizado') // Filtro añadido aquí
      .map(order => {
        const date = new Date(order.FechaEntrega);
        // Establecer hora a medianoche para evitar problemas de zona horaria
        date.setHours(0, 0, 0, 0);
        
        return {
          id: order.OrdenID,
          title: `${order.NumeroOrden} - ${order.NombreCliente || 'Cliente'}`,
          start: date,
          end: date,
          allDay: true,
          resource: order
        };
      });
  }, [orders]);

  // Manejar clic en un evento
  const handleSelectEvent = (event) => {
    setSelectedOrderId(event.id);
    setShowOrderDetail(true);
  };

  // Personalizar el estilo de los eventos
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: '#003366',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '12px',
      padding: '2px 5px'
    };
    return { style };
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center gap-2">
            <span className="text-primary">📅</span>
            Calendario de Órdenes de Pedido
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '70vh', padding: '20px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            date={currentDate}
            view={currentView}
            onNavigate={(date) => setCurrentDate(date)}
            onView={(view) => setCurrentView(view)}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={{
              next: 'Siguiente',
              previous: 'Anterior',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Orden',
              noEventsInRange: 'No hay órdenes en este rango de fechas',
              showMore: (total) => `+ Ver más (${total})`
            }}
            views={{
              month: true,
              week: true,
              day: true,
              agenda: true
            }}
            formats={{
              monthHeaderFormat: (date) => moment(date).format('MMMM YYYY'),
              dayHeaderFormat: (date) => moment(date).format('dddd, D [de] MMMM'),
              dayRangeHeaderFormat: ({ start, end }) => 
                `${moment(start).format('D [de] MMMM')} - ${moment(end).format('D [de] MMMM YYYY')}`,
              agendaHeaderFormat: ({ start, end }) => 
                `${moment(start).format('D [de] MMMM')} - ${moment(end).format('D [de] MMMM YYYY')}`,
              agendaDateFormat: (date) => moment(date).format('ddd DD/MM'),
              agendaTimeFormat: () => '',
              agendaTimeRangeFormat: () => ''
            }}
            popup
            selectable
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de detalle de orden */}
      {showOrderDetail && (
        <OrderDetailModal
          show={showOrderDetail}
          onHide={() => setShowOrderDetail(false)}
          orderId={selectedOrderId}
          onRefresh={() => {}}
        />
      )}
    </>
  );
};

export default OrderCalendarModal;