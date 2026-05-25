const universityCalendarData = {
  ELTE: {
    name: "ELTE",
    color: "#2563eb",
    events: [
      {
        title: "ELTE 長期休暇",
        category: "break",
        start: "2026-04-01",
        end: "2026-04-08"
      },
      {
        title: "ELTE テスト期間",
        category: "exam",
        start: "2026-05-18",
        end: "2026-07-04"
      }
    ]
  },

  BGE: {
    name: "BGE",
    color: "#16a34a",
    events: [
      {
        title: "BGE 長期休暇",
        category: "break",
        start: "2026-04-02",
        end: "2026-04-09"
      }
    ]
  },

  BME: {
    name: "BME",
    color: "#dc2626",
    events: [
      {
        title: "BME 長期休暇",
        category: "break",
        start: "2026-04-02",
        end: "2026-04-08"
      }
    ]
  },

  Corvinus: {
    name: "Corvinus",
    color: "#7c3aed",
    events: []
  },

  Debrecen: {
    name: "Debrecen",
    color: "#ea580c",
    events: []
  },

  Szeged: {
    name: "Szeged",
    color: "#0891b2",
    events: [
      {
        title: "Szeged 長期休暇",
        category: "break",
        start: "2026-04-02",
        end: "2026-04-08"
      }
    ]
  },

  Pecs: {
    name: "Pécs",
    color: "#be123c",
    events: []
  },

  Szechenyi: {
    name: "Széchenyi",
    color: "#4f46e5",
    events: []
  },

  IBS: {
    name: "IBS",
    color: "#0f766e",
    events: []
  }
};

const selectedUniversities = [];
let currentMode = "break";
let calendar;

document.addEventListener("DOMContentLoaded", () => {
  const calendarElement = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarElement, {
    initialView: "dayGridMonth",
    initialDate: "2026-04-01",
    locale: "ja",
    height: "auto",
    events: []
  });

  calendar.render();

  setupModeButtons();
  setupUniversityButtons();
  renderSelectedUniversities();
  renderCalendarEvents();
});

function setupModeButtons() {
  const modeButtons = document.querySelectorAll(".modeBtn");

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      modeButtons.forEach((modeButton) => {
        modeButton.classList.remove("active");
      });

      button.classList.add("active");
      currentMode = button.dataset.mode;

      renderCalendarEvents();
    });
  });
}

function setupUniversityButtons() {
  const universityButtons = document.querySelectorAll(".uniBtn");

  universityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const university = button.dataset.university;

      if (!universityCalendarData[university]) {
        return;
      }

      if (selectedUniversities.includes(university)) {
        return;
      }

      selectedUniversities.push(university);

      updateUniversityButtons();
      renderSelectedUniversities();
      renderCalendarEvents();
    });
  });
}

function updateUniversityButtons() {
  const universityButtons = document.querySelectorAll(".uniBtn");

  universityButtons.forEach((button) => {
    const university = button.dataset.university;

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
      <span>${universityData.name}</span>
      <span class="removeTag" data-university="${university}">×</span>
    `;

    selectedElement.appendChild(tag);
  });

  const removeButtons = document.querySelectorAll(".removeTag");

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const university = button.dataset.university;
      const index = selectedUniversities.indexOf(university);

      if (index > -1) {
        selectedUniversities.splice(index, 1);
      }

      updateUniversityButtons();
      renderSelectedUniversities();
      renderCalendarEvents();
    });
  });
}

function renderCalendarEvents() {
  calendar.removeAllEvents();

  selectedUniversities.forEach((university) => {
    const universityData = universityCalendarData[university];

    universityData.events
      .filter((event) => event.category === currentMode)
      .forEach((event) => {
        calendar.addEvent({
          title: event.title,
          start: event.start,
          end: event.end,
          color: universityData.color
        });
      });
  });
}