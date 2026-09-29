import React from 'react';

// Helper function to process and clean text content
const processText = (text) => {
  if (typeof text !== 'string') return '';
  // Clean up excessive newlines and trim whitespace
  return text.replace(/\s+/g, ' ').trim();
};


// Helper function to render KPI tables
const renderKpiTable = (title, kpiData) => (
  <div className='print:break-inside-avoid' style={{ breakInside: 'avoid', pageBreakInside: 'avoid', display: 'block', marginBottom: '2rem' }}>
    <h3>{title}</h3>
    <table className="data-table fixed-layout">
      <thead>
        <tr>
          <th style={{ width: '30%' }}>KPI</th>
          <th style={{ width: '20%' }}>Target</th>
          <th style={{ width: '20%' }}>Realisasi</th>
          <th style={{ width: '12%' }}>Jenis</th>
          <th style={{ width: '12%' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {(kpiData || []).map((item, index) => {
          if (!item.kpi) {
            return null;
          }
          return (
            <tr key={index} style={{ pageBreakInside: 'avoid' }}>
              <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processText(item.kpi)}</td>
              <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processText(item.target)}</td>
              <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processText(item.real)}</td>
              <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processText(item.jenis)}</td>
              <td className={item.status === 'on' ? 'status-on' : 'status-off'}>
                {item.status === 'on' ? 'ON' : 'OFF'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const PdfComponent = React.forwardRef(({ data }, ref) => {
  if (!data) {
    return <div ref={ref}>Loading...</div>;
  }

  // Calculate average rating
  const relevantRatings = (data?.attendances || [])
    .map(a => parseFloat(data.ratings['rating_id_' + a.id]))
    .filter(v => !isNaN(v) && v > 0);
  const averageRaw = relevantRatings.length
    ? (relevantRatings.reduce((a, b) => a + b, 0) / relevantRatings.length)
    : 0;
  const averageRating = parseFloat(averageRaw.toFixed(1));

  return (
    <div ref={ref} className="pdf-container">
      {/* Slide 0: Title Page */}
      <div className="pdf-page">
        <div className="title-page-content">
          <div className="title-date-label">Tanggal Rapat</div>
          <div className="title-date">{data.meetingDate}</div>
        </div>
      </div>

      {/* Slide 1: Initial Segment */}
      <div className="pdf-page page-break">
        <h2>Segmen Awal: Kehadiran & Kabar Baik</h2>
        <div className="grid-2-col">
          <div className="card-pdf">
            <h3>Daftar Hadir</h3>
            <ul>
              {(data?.attendances || []).map(item => (
                <li key={item.id} className={item.checked ? 'present' : 'absent'}>
                  <span className="checkbox-pdf">{item.checked ? '✓' : '✗'}</span> {item.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-pdf">
            <h3>Good News (Kabar Syukur)</h3>
            <p><strong>Owner:</strong> {data?.goodNews?.owner}</p>
            <p><strong>Integrator:</strong> {data?.goodNews?.integrator}</p>
            <p><strong>Perwakilan Tim:</strong> {data?.goodNews?.team}</p>
          </div>
        </div>
      </div>
      
      {/* KPI Slides */}
      <div className='w-full h-auto bg-white print:bg-transparent'>
        <h2>Scorecard Review</h2>
        {renderKpiTable(data?.scorecardTitles?.marketingKPI, data?.marketingKPI)}
        {renderKpiTable(data?.scorecardTitles?.creativeKPI, data?.creativeKPI)}
        {renderKpiTable(data?.scorecardTitles?.rndKPI, data?.rndKPI)}
        {renderKpiTable(data?.scorecardTitles?.ppicKPI, data?.ppicKPI)}
        {renderKpiTable(data?.scorecardTitles?.financeKPI, data?.financeKPI)}
        {renderKpiTable(data?.scorecardTitles?.gudangKPI, data?.gudangKPI)}
        {renderKpiTable(data?.scorecardTitles?.operasionalKPI, data?.operasionalKPI)}
      </div>

      {/* Rock Review */}
      <div className="pdf-page page-break">
        <h2>Rock Review (Prioritas 90 Hari)</h2>
        <table className="data-table fixed-layout">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Owner</th>
              <th style={{ width: '40%' }}>Rock</th>
              <th style={{ width: '15%' }}>Status</th>
              <th style={{ width: '25%' }}>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rockReview || []).map((item, i) => {
              if (!item.rock || !item.owner) {
                return null;
              }
              return (
                <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ wordWrap: 'break-word' }}>{processText(item.owner)}</td>
                  <td style={{ wordWrap: 'break-word' }}>{processText(item.rock)}</td>
                  <td className={item.status === 'on' ? 'status-on' : 'status-off'}>
                    {item.status === 'on' ? 'ON' : 'OFF'}
                  </td>
                  <td style={{ wordWrap: 'break-word' }}>{processText(item.note)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Headlines */}
      <div className="pdf-page page-break">
        <h2>Headlines (Customer & Internal)</h2>
        <div className="grid-2-col">
          <div className="card-pdf">
            <h3>Customer Headlines</h3>
            <ol>{(data?.headlines?.customer || []).map((hl, i) => <li key={i}>{processText(hl)}</li>)}</ol>
          </div>
          <div className="card-pdf">
            <h3>Internal Headlines</h3>
            <ol>{(data?.headlines?.internal || []).map((hl, i) => <li key={i}>{processText(hl)}</li>)}</ol>
          </div>
        </div>
      </div>

      {/* To-Do List */}
      <div className="pdf-page page-break">
        <h2>To-Do List (Action Plan)</h2>
        <table className="data-table fixed-layout">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Tugas</th>
              <th style={{ width: '30%' }}>Owner</th>
              <th style={{ width: '20%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.todoList || []).map((item, i) => {
              if (!item.text || !item.owner) {
                return null;
              }
              return (
                <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ wordWrap: 'break-word' }}>{processText(item.text)}</td>
                  <td style={{ wordWrap: 'break-word' }}>{processText(item.owner)}</td>
                  <td>{item.outcome === 'done' ? 'Tercapai' : 'Belum'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* IDS Session */}
      <div className="pdf-page page-break">
        <h2>IDS Session (Identify, Discuss, Solve)</h2>
        <div className="grid-3-col">
            <div className="card-pdf" style={{ pageBreakInside: 'avoid' }}>
              <h3>1. Issues List</h3>
              <ul>
                {(data?.ids?.issues || [])
                  .filter((issue, index, self) => 
                    index === self.findIndex(t => processText(t.text) === processText(issue.text))
                  )
                  .map((issue, i) => <li key={i} style={{ pageBreakInside: 'avoid' }}>{processText(issue.text)}</li>)
                }
              </ul>
            </div>
            <div className="card-pdf" style={{ pageBreakInside: 'avoid' }}>
              <h3>2. Discuss Notes</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data?.ids?.notes}</p>
            </div>
            <div className="card-pdf" style={{ pageBreakInside: 'avoid' }}>
              <h3>3. Solve (Action Items)</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data?.ids?.solutions}</p>
            </div>
        </div>
      </div>

      {/* Concluding Segment */}
      <div className="pdf-page page-break">
        <h2>Segmen Akhir: Rating Rapat</h2>
        <div className="ratings-summary">
            <div className="avg-rating-container">
                <div className="avg-rating-label">Rata-Rata Rating</div>
                <div className="avg-rating-value">{averageRating}</div>
            </div>
            <div className="ratings-list">
              <h3>Detail Rating:</h3>
              <ul>
                {(data?.attendances || [])
                  .filter(a => a.checked && data.ratings['rating_id_' + a.id])
                  .map(attendee => (
                    <li key={attendee.id}>
                      <strong>{attendee.name}:</strong> {data.ratings['rating_id_' + attendee.id]}
                    </li>
                  ))}
              </ul>
            </div>
        </div>
        <p className="final-quote">
            "Rapat yang hebat dimulai dari kedisiplinan dan diakhiri dengan komitmen."
        </p>
      </div>
    </div>
  );
});

export default PdfComponent;
