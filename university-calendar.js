const universityCalendarData = {
  ELTE: {
    name: "ELTE",
    fullName: "Eötvös Loránd University",
    color: "#2563eb",
    events: [
      {
        title: "ELTE 長期休暇",
        category: "break",
        start: "2026-04-01",
        end: "2026-04-08",
        note: "ELTEの長期休暇期間です。学部により異なる場合があります。"
      },
      {
        title: "ELTE テスト期間",
        category: "exam",
        start: "2026-05-18",
        end: "2026-07-03",
        note: "ここにELTEの試験期間・再試験期間情報を入れます。学部により異なる場合があります。"
      }
    ]
  },

  BGE: {
    name: "BGE",
    fullName: "Budapest University of Economics and Business",
    color: "#16a34a",
    events: [
      {
        title: "BGE 長期休暇",
        category: "break",
        start: "2026-04-02",
        end: "2026-04-09",
        note: "BGEの長期休暇期間です。"
      },
      {
        title: "BGE テスト期間",
        category: "exam",
        start: "",
        end: "",
        note: "BGEの試験期間・再試験期間を確認後に入力します。"
      }
    ]
  },

  BME: {
    name: "BME",
    fullName: "Budapest University of Technology and Economics",
    color: "#dc2626",
    events: [
      {
        title: "BME 長期休暇",
        category: "break",
        start: "2026-04-02",
        end: "2026-04-08",
        note: "BMEの長期休暇期間です。"
      }
    ]
  },

  Corvinus: {
    name: "Corvinus",
    fullName: "Corvinus University of Budapest",
    color: "#7c3aed",
    events: []
  },

  Debrecen: {
    name: "Debrecen",
    fullName: "University of Debrecen",
    color: "#ea580c",
    events: []
  },

  Szeged: {
    name: "Szeged",
    fullName: "University of Szeged",
    color: "#0891b2",
    events: [
      {
        title: "Szeged 長期休暇",
        category: "break",
        start: "2026-04-02",
        end: "2026-04-08",
        note: "Szegedの長期休暇期間です。"
      }
    ]
  },

  Pecs: {
    name: "Pécs",
    fullName: "University of Pécs",
    color: "#be123c",
    events: []
  },

  Szechenyi: {
    name: "Széchenyi",
    fullName: "Széchenyi István University",
    color: "#4f46e5",
    events: []
  },

  IBS: {
    name: "IBS",
    fullName: "International Business School",
    color: "#0f766e",
    events: []
  }
};

const selectedUniversities = [];
let currentMode = "break";

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

document.addEventListener("DOMContentLoaded", () => {
  setupModeButtons();
  setupUniversityButtons();
  renderSelectedUniversities();
  renderYearCalendar();
});

function setupModeButtons() {
  const modeButtons = document.querySelectorAll(".modeBtn");

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      modeButtons.forEach((modeButton) => {
        modeButton.classList.remove("active");
      });

      button.classList.add("active");
      currentMode = button.dataset.mode || "break";

      renderYearCalendar();
    });
  });
}

function setupUniversityButtons() {
  const universityButtons = document.querySelectorAll(".uniBtn");

  universityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const university = button.dataset.university;

      if (!universityCalendarData[university]) return;
      if (selectedUniversities.includes(university)) return;

      selectedUniversities.push(university);

      updateUniversityButtons();
      renderSelectedUniversities();
      renderYearCalendar();
    });
  });
}

function updateUniversityButtons() {
  const universityButtons = document.querySelectorAll(".uniBtn");

  universityButtons.forEach((button) => {
    const university = button.dataset.university;

    if (!universityCalendarData[university]) return;

    if (selectedUniversities.includes(university)) {
      button.classList.add("isSelected");
      button.textContent = `${universityCalendarData[university].name} 選択中`;
    } else {
      button.classList.remove("isSelected");
      button.textContent = `${universityCalendarData[university].name} ＋`;
    }
  });
}

function renderSelectedUniversities() {
  const selectedElement = document.getElementById("selectedUniversities");
  if (!selectedElement) return;

  selectedElement.innerHTML = "";

  if (selectedUniversities.length === 0) {
    selectedElement.innerHTML = `
      <div class="emptyCalendarMessage">
        まだ大学が選択されていません。
      </div>
    `;
    return;
  }

  selectedUniversities.forEach((university) => {
    const universityData = universityCalendarData[university];

    const tag = document.createElement("div");
    tag.className = "selectedTag";

    tag.innerHTML = `
      <span>${escapeHtml(universityData.name)}</span>
      <span class="removeTag" data-university="${escapeHtml(university)}">×</span>
    `;

    selectedElement.appendChild(tag);
  });

  selectedElement.querySelectorAll(".removeTag").forEach((button) => {
    button.addEventListener("click", () => {
      const university = button.dataset.university;
      const index = selectedUniversities.indexOf(university);

      if (index > -1) {
        selectedUniversities.splice(index, 1);
      }

      updateUniversityButtons();
      renderSelectedUniversities();
      renderYearCalendar();
    });
  });
}

function renderYearCalendar() {
  const calendarElement = document.getElementById("calendar");
  if (!calendarElement) return;

  const selectedEvents = getSelectedEvents();

  calendarElement.innerHTML = `
    <div class="yearCalendarWrap">
      <div class="yearCalendarHead">
        <h3 class="yearCalendarTitle">2026年カレンダー</h3>
        <p class="yearCalendarDesc">
          選択した大学の${currentMode === "exam" ? "テスト期間" : "長期休暇"}を、カレンダー上に期間バーで表示します。
        </p>
      </div>

      ${
        selectedUniversities.length === 0
          ? `
            <div class="emptyCalendarMessage">
              大学を選択すると、ここに年間カレンダーが表示されます。
            </div>
          `
          : ""
      }

      ${
        selectedUniversities.length > 0 && selectedEvents.length === 0
          ? `
            <div class="emptyCalendarMessage">
              選択中の大学には、この項目の期間データがまだありません。
            </div>
          `
          : ""
      }

      ${renderEventSummary(selectedEvents)}

      <div class="yearCalendarGrid">
        ${monthNames.map((monthName, index) => {
          return renderMonthCalendar(2026, index + 1, monthName, selectedEvents);
        }).join("")}
      </div>
    </div>
  `;
}

function getSelectedEvents() {
  const events = [];

  selectedUniversities.forEach((universityKey) => {
    const universityData = universityCalendarData[universityKey];
    if (!universityData) return;

    universityData.events
      .filter((event) => event.category === currentMode)
      .forEach((event) => {
        if (!event.start || !event.end) return;

        events.push({
          ...event,
          universityKey,
          universityName: universityData.name,
          universityFullName: universityData.fullName,
          color: universityData.color
        });
      });
  });

  return events;
}

function renderEventSummary(events) {
  if (!events.length) return "";

  return `
    <div class="calendarSummary">
      ${events.map((event) => {
        return `
          <div class="calendarSummaryItem" style="--event-color:${escapeHtml(event.color)}">
            <span class="calendarSummaryDot"></span>
            <div>
              <strong>${escapeHtml(event.title)}</strong>
              <span>${formatJapaneseDate(event.start)} 〜 ${formatJapaneseDate(event.end)}</span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderMonthCalendar(year, month, monthName, events) {
  const weeks = buildMonthWeeks(year, month);

  return `
    <section class="monthCalendar">
      <h4 class="monthTitle">${escapeHtml(monthName)}</h4>

      <div class="monthWeekHeader">
        ${weekDays.map((day) => `<div>${escapeHtml(day)}</div>`).join("")}
      </div>

      <div class="monthWeeks">
        ${weeks.map((week) => renderWeekRow(week, events)).join("")}
      </div>
    </section>
  `;
}

function renderWeekRow(week, events) {
  const weekStart = week[0].date;
  const weekEnd = week[6].date;

  const segments = [];

  events.forEach((event, eventIndex) => {
    const eventStart = parseDate(event.start);
    const eventEnd = parseDate(event.end);

    if (eventEnd < weekStart || eventStart > weekEnd) return;

    const segmentStart = eventStart > weekStart ? eventStart : weekStart;
    const segmentEnd = eventEnd < weekEnd ? eventEnd : weekEnd;

    const startColumn = getMondayBasedColumn(segmentStart);
    const endColumn = getMondayBasedColumn(segmentEnd);

    const isRealStart = isSameDate(segmentStart, eventStart);
    const isRealEnd = isSameDate(segmentEnd, eventEnd);

    const label = `${isRealStart ? "← " : ""}${event.title}${isRealEnd ? " →" : " →"}`;

    segments.push({
      event,
      eventIndex,
      startColumn,
      endColumn,
      label
    });
  });

  return `
    <div class="calendarWeek">
      <div class="calendarDaysRow">
        ${week.map((day) => {
          const isCurrentMonth = day.isCurrentMonth ? "" : " otherMonth";
          const isWeekend = day.isWeekend ? " weekend" : "";

          return `
            <div class="calendarDay${isCurrentMonth}${isWeekend}">
              <span>${day.date.getDate()}</span>
            </div>
          `;
        }).join("")}
      </div>

      <div class="calendarBarsRow">
        ${
          segments.length
            ? segments.map((segment) => {
                return `
                  <div
                    class="periodBar"
                    style="
                      grid-column:${segment.startColumn} / ${segment.endColumn + 1};
                      --event-color:${escapeHtml(segment.event.color)};
                    "
                    title="${escapeHtml(segment.event.title)}：${formatJapaneseDate(segment.event.start)}〜${formatJapaneseDate(segment.event.end)}"
                  >
                    <span>${escapeHtml(segment.label)}</span>
                  </div>
                `;
              }).join("")
            : `<div class="emptyBarSpace"></div>`
        }
      </div>
    </div>
  `;
}

function buildMonthWeeks(year, month) {
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0);

  const firstMondayOffset = getMondayBasedColumn(firstDate) - 1;
  const calendarStart = addDays(firstDate, -firstMondayOffset);

  const weeks = [];
  let current = new Date(calendarStart);

  while (current <= lastDate || weeks.length < 6) {
    const week = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(current);
      const day = date.getDay();

      week.push({
        date,
        isCurrentMonth: date.getMonth() === month - 1,
        isWeekend: day === 0 || day === 6
      });

      current = addDays(current, 1);
    }

    weeks.push(week);

    if (current > lastDate && weeks.length >= 5) {
      break;
    }
  }

  return weeks;
}

function getMondayBasedColumn(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatJapaneseDate(value) {
  if (!value) return "確認中";

  const date = parseDate(value);

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}