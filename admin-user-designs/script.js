// Pagination state
let currentPage = 1;
const itemsPerPage = 20;
let totalOrders = 0;
let currentFilter = "None"

// DOM elements
const tableBody = document.getElementById("orders-table-body")
const prevPageBtn = document.getElementById("prev-page")
const nextPageBtn = document.getElementById("next-page")
const pageNumbers = document.querySelector(".page-numbers")
const paginationInfo = document.querySelector(".pagination-info")
const filterButton = document.getElementById("filterButton")
const filterPopup = document.getElementById("filterPopup")
const filterOptions = document.querySelectorAll(".filter-option")
const currentFilterSpans = document.querySelectorAll("#currentFilter")

// Navigation functions
function goToPage(page) {
  currentPage = page;
  updateTable();
}

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    updateTable();
  }
});

nextPageBtn.addEventListener('click', () => {
  if (currentPage < Math.ceil(totalOrders / itemsPerPage)) {
    currentPage++;
    updateTable();
  }
});

filterButton.addEventListener("click", () => {
  filterPopup.classList.toggle("show")
})

filterOptions.forEach((option) => {
  option.addEventListener("click", function () {
    currentFilter = this.dataset.filter
    currentPage = 1 // Reset to first page when changing filter
    updateCurrentFilterText()
    filterPopup.classList.remove("show")
    updateTable() // Refresh the table with the new filter
  })
})

// Close the popup when clicking outside
document.addEventListener("click", (event) => {
  if (!filterButton.contains(event.target) && !filterPopup.contains(event.target)) {
    filterPopup.classList.remove("show")
  }
})
// Function to update the current filter text
function updateCurrentFilterText() {
  currentFilterSpans.forEach((span) => {
    if (currentFilter === "all") {
      span.textContent = span.hasAttribute("data-en") ? "All" : "Tous"
    } else if (currentFilter === "with") {
      span.textContent = span.hasAttribute("data-en") ? "With Designs" : "Avec Conceptions"
    } else if (currentFilter === "without") {
      span.textContent = span.hasAttribute("data-en") ? "Without Designs" : "Sans Conceptions"
    }
  })
}

// Initialize the filter text
updateCurrentFilterText()
updateTable() // Initialize the table

function updatePaginationInfo(start, end, total) {
  const paginationInfo = document.querySelector(".pagination-info")
  if (!paginationInfo) return

  const currentLang = getCurrentLanguage()

  const translations = {
    en: `Showing ${start} to ${end} of ${total} results`,
    fr: `Affichage de ${start} à ${end} sur ${total} résultats`,
  }

  paginationInfo.textContent = translations[currentLang]
}

// Update page number buttons
function updatePageNumbers(totalPages) {
  let pages = []
  if (totalPages <= 3) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  } else if (currentPage <= 2) {
    pages = [1, 2, 3]
  } else if (currentPage >= totalPages - 1) {
    pages = [totalPages - 2, totalPages - 1, totalPages]
  } else {
    pages = [currentPage - 1, currentPage, currentPage + 1]
  }

  pageNumbers.innerHTML = pages
    .map(
      (page) => `
          <button class="page-number ${page === currentPage ? "active" : ""}"
                  onclick="goToPage(${page})">${page}</button>
      `,
    )
    .join("")
}

// Fetch profiles from Supabase
async function fetchProfiles() {
  const { data, error, count } = await supabase
    .from("profiles")
    .select(
      "user_id, created_at, first_name, email, last_name, phone, club_name, address_line1, city, state, country, zip_code",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching profiles:", error)
    return { profiles: [], totalCount: 0 }
  }

  return { profiles: data, totalCount: count }
}

async function fetchDesignCount(userId) {
  const { data, error, count } = await supabase
    .from('user_files')
    .select('owner', { count: 'exact' })
    .eq('owner', userId)
    .not('design_metadata', 'is', null);

  if (error) {
    console.error('Error fetching design count:', error);
    return 0;
  }

  return count;
}

// Update table with current page data
async function updateTable() {
  const { profiles, totalCount } = await fetchProfiles()
  const start = (currentPage - 1) * itemsPerPage
  const currentLang = getCurrentLanguage()
  showLoading();
  const profilesWithDesignCounts = await Promise.all(
    profiles.map(async (profile) => {
      const designsCount = await fetchDesignCount(profile.user_id)
      return { ...profile, designsCount }
    }),
  )

  const filteredProfiles = profilesWithDesignCounts.filter((profile) => {
    if (currentFilter === "with") return profile.designsCount > 0
    if (currentFilter === "without") return profile.designsCount === 0
    return true // 'all' filter
  })

  const paginatedProfiles = filteredProfiles.slice(start, start + itemsPerPage)

  const tableRows = paginatedProfiles.map((profile, index) => {
    const createdDate = new Date(profile.created_at)
    const formattedDate = new Intl.DateTimeFormat(currentLang, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(createdDate)
    const formattedTime = new Intl.DateTimeFormat(currentLang, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(createdDate)

    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    const fullAddress = `${profile.address_line1 || ""}, ${profile.city || ""}, ${profile.state || ""},<br>${profile.country || ""}- ${profile.zip_code || ""}`

    const designsCell =
      profile.designsCount > 0
        ? `<a href="#" class="clickable-link" onclick="showUserDesigns('${profile.user_id}')">${profile.designsCount}</a>`
        : ""

    return `
              <tr>
                  <td>${start + index + 1}</td>
                  <td>
                      ${formattedDate}<br>
                      <span class="order-time">${formattedTime}</span>
                  </td>
                  <td>${fullName}</td>
                  <td>${profile.email || ""}</td>
                  <td>${profile.phone || ""}</td>
                  <td>${profile.club_name || ""}</td>
                  <td>${fullAddress}</td>
                  <td>${designsCell}</td>
              </tr>
          `
  })

  tableBody.innerHTML = tableRows.join("")

  // Update pagination info
  const filteredTotalCount = filteredProfiles.length
  totalOrders = filteredTotalCount // Update totalOrders for pagination button checks
  const totalPages = Math.ceil(filteredTotalCount / itemsPerPage)
  updatePaginationInfo(start + 1, Math.min(start + paginatedProfiles.length, filteredTotalCount), filteredTotalCount)

  // Update pagination buttons
  prevPageBtn.disabled = currentPage === 1
  nextPageBtn.disabled = currentPage === totalPages

  // Update page numbers
  updatePageNumbers(totalPages)
  hideLoading();
}

// Initialize the table
updateTable();

function showUserDesigns(userId) {
  window.open(`/admin-my-designs/?owner=${userId}`, '_blank');
}