Priority 1:  Infosys-managed SFTP (80% of retailers in customer, 100% of distributors)

Next:
- Retailers sending data via emails can instead upload to web app or use REST API of the web app.
- Retailers sending data via their own SFTPs can instead use the REST API of the web app, or we can support pulling data from their SFTPs.
- Retailers with web portals that have no public APIs would require manual action to download files and reupload into web app (we prefer not to engage in web scraping and usage of private APIs that may change, for reliability and legal reasons).

Retailers/Distributors that have data in the cloud can use cloud data exchange services (Databricks Delta sharing, Azure Data Share, AWS Data Exchange, Bigquery, Snowflake), or offer access to their data via REST APIs that we will directly connect to, instead of requiring upload via web app.
