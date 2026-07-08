(function () {
  function togglePublicationPanel(trigger) {
    var panelType = trigger.classList.contains("bibtex") ? "bibtex" : "abstract";
    var publication = trigger.closest(".publication-entry") || trigger.closest("li");
    if (!publication) return;

    var panel = publication.querySelector("." + panelType + ".hidden");
    if (!panel) return;

    var siblingType = panelType === "bibtex" ? "abstract" : "bibtex";
    var sibling = publication.querySelector("." + siblingType + ".hidden.open");
    var willOpen = !panel.classList.contains("open");

    if (sibling) {
      sibling.classList.remove("open");
    }

    panel.classList.toggle("open", willOpen);
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");

    publication.querySelectorAll("a." + siblingType + "[aria-expanded='true']").forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
  }

  function initPublicationToggles() {
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("a.abstract, a.bibtex");
      if (!trigger) return;

      event.preventDefault();
      togglePublicationPanel(trigger);
    });
  }

  function datasetName(key) {
    return "filter" + key.charAt(0).toUpperCase() + key.slice(1);
  }

  function itemMatches(item, activeFilters) {
    return Object.keys(activeFilters).every(function (key) {
      var expected = activeFilters[key];
      if (!expected || expected === "all") return true;

      var value = item.dataset[datasetName(key)] || "";
      return value.split(/\s+/).indexOf(expected) !== -1;
    });
  }

  function setBibliographyHeadings(scope) {
    scope.querySelectorAll("h2.bibliography").forEach(function (heading) {
      var node = heading.nextElementSibling;
      while (node && !node.matches("ol.bibliography")) {
        node = node.nextElementSibling;
      }

      if (!node) return;

      var visibleEntries = Array.prototype.slice.call(node.querySelectorAll("li")).some(function (entry) {
        return !entry.hidden;
      });

      heading.hidden = !visibleEntries;
    });
  }

  function initFilterScope(scope) {
    var itemSelector = scope.dataset.filterItems || ".js-filter-item";
    var items = Array.prototype.slice.call(scope.querySelectorAll(itemSelector));
    var buttons = Array.prototype.slice.call(scope.querySelectorAll(".filter-button[data-filter-key]"));
    var emptyState = scope.querySelector(".filter-empty");
    var activeFilters = {};

    buttons.forEach(function (button) {
      var key = button.dataset.filterKey;
      if (button.classList.contains("is-active")) {
        activeFilters[key] = button.dataset.filterValue || "all";
      }
      button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");
    });

    function applyFilters() {
      var visibleCount = 0;

      items.forEach(function (item) {
        var visible = itemMatches(item, activeFilters);
        var container = item.closest("li") || item;
        container.hidden = !visible;
        item.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      }

      setBibliographyHeadings(scope);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.dataset.filterKey;
        var value = button.dataset.filterValue || "all";
        activeFilters[key] = value;

        buttons
          .filter(function (candidate) {
            return candidate.dataset.filterKey === key;
          })
          .forEach(function (candidate) {
            var isActive = candidate === button;
            candidate.classList.toggle("is-active", isActive);
            candidate.setAttribute("aria-pressed", isActive ? "true" : "false");
          });

        applyFilters();
      });
    });

    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPublicationToggles();
    document.querySelectorAll("[data-filter-scope]").forEach(initFilterScope);
  });
})();
