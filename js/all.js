document.addEventListener("DOMContentLoaded", function () {

      const currentPath = window.location.pathname;

      // Check if the current URL ends with .html
      if (currentPath.endsWith(".html")) {

        // Remove .html
        const cleanPath = currentPath.replace(/\.html$/, "");

        // Change the URL without refreshing the page
        window.history.replaceState(
          {},
          document.title,
          cleanPath + window.location.search + window.location.hash
        );
      }

    });
