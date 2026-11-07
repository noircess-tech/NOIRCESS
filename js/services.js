document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get("service");

    const sections = [
        ...document.querySelectorAll(
            ".service-detail[data-service-id]"
        )
    ];

    const selected = sections.find(
        section => section.dataset.serviceId === serviceId
    );

    sections.forEach(section => {
        section.hidden = section !== selected;
    });

    const notFound = document.getElementById("service-not-found");

    if (notFound) {
        notFound.hidden = Boolean(selected);
    }

    if (selected) {
        document.title =
            `${selected.dataset.pageTitle} | NOIRCESS`;

        document.body.dataset.serviceId = serviceId;
    } else {
        document.title = "Service Not Found | NOIRCESS";
    }
});