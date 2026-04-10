<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<title>XML Sitemap</title>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<style type="text/css">
					body {
						font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
						color: #333;
						margin: 0;
						padding: 40px;
						background-color: #f9fafb;
					}
					.wrapper {
						max-width: 900px;
						margin: 0 auto;
					}
					.header {
						margin-bottom: 24px;
					}
					.header h1 {
						font-size: 28px;
						font-weight: 700;
						color: #111827;
						margin: 0 0 12px 0;
					}
					.header p {
						font-size: 15px;
						color: #4b5563;
						margin: 0 0 8px 0;
						line-height: 1.5;
					}
					.header a {
						color: #2563eb;
						text-decoration: none;
					}
					.header a:hover {
						text-decoration: underline;
					}
					.table-container {
						background: #ffffff;
						border-radius: 12px;
						box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
						overflow: hidden;
						margin-bottom: 24px;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						text-align: left;
					}
					th {
						background-color: #f3f4f6;
						color: #374151;
						font-weight: 600;
						font-size: 13px;
						padding: 16px 24px;
						border-bottom: 2px solid #e5e7eb;
						text-transform: uppercase;
						letter-spacing: 0.05em;
					}
					td {
						padding: 16px 24px;
						font-size: 14px;
						border-bottom: 1px solid #e5e7eb;
						color: #4b5563;
						word-break: break-all;
					}
					tr:last-child td {
						border-bottom: none;
					}
					tr:hover {
						background-color: #f9fafb;
						transition: background-color 0.2s ease;
					}
					td a {
						color: #2563eb;
						text-decoration: none;
						font-weight: 500;
					}
					td a:hover {
						text-decoration: underline;
						color: #1d4ed8;
					}
					.meta-info {
						font-size: 14px;
						color: #6b7280;
						text-align: center;
						padding: 16px 0;
						border-top: 1px solid #e5e7eb;
						margin-top: 32px;
					}
				</style>
			</head>
			<body>
				<div class="wrapper">
					<div class="header">
						<h1>XML Sitemap</h1>
						<p>This is an XML Sitemap generated dynamically for search engines like Google and Bing.</p>
						<p>You can find more information about XML sitemaps on <a href="https://www.sitemaps.org" target="_blank">sitemaps.org</a>.</p>
					</div>
					<div class="table-container">
						<xsl:choose>
							<xsl:when test="sitemap:sitemapindex">
								<table>
									<thead>
										<tr>
											<th>Sitemap</th>
											<th width="25%">Last Modified</th>
										</tr>
									</thead>
									<tbody>
										<xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
											<tr>
												<td>
													<xsl:variable name="itemURL">
														<xsl:value-of select="sitemap:loc"/>
													</xsl:variable>
													<a href="{$itemURL}">
														<xsl:value-of select="sitemap:loc"/>
													</a>
												</td>
												<td>
													<xsl:value-of select="substring(sitemap:lastmod,0,11)"/>
													<xsl:text> </xsl:text>
													<xsl:value-of select="substring(sitemap:lastmod,12,5)"/>
												</td>
											</tr>
										</xsl:for-each>
									</tbody>
								</table>
							</xsl:when>
							<xsl:otherwise>
								<table>
									<thead>
										<tr>
											<th>URL</th>
											<th width="10%">Priority</th>
											<th width="15%">Change Freq</th>
											<th width="20%">Last Modified</th>
										</tr>
									</thead>
									<tbody>
										<xsl:for-each select="sitemap:urlset/sitemap:url">
											<tr>
												<td>
													<xsl:variable name="itemURL">
														<xsl:value-of select="sitemap:loc"/>
													</xsl:variable>
													<a href="{$itemURL}">
														<xsl:value-of select="sitemap:loc"/>
													</a>
												</td>
												<td>
													<xsl:value-of select="sitemap:priority"/>
												</td>
												<td style="text-transform: capitalize;">
													<xsl:value-of select="sitemap:changefreq"/>
												</td>
												<td>
													<xsl:value-of select="substring(sitemap:lastmod,0,11)"/>
													<xsl:text> </xsl:text>
													<xsl:value-of select="substring(sitemap:lastmod,12,5)"/>
												</td>
											</tr>
										</xsl:for-each>
									</tbody>
								</table>
							</xsl:otherwise>
						</xsl:choose>
					</div>
					<div class="meta-info">
						<xsl:choose>
							<xsl:when test="sitemap:sitemapindex">
								This sitemap index contains <strong><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></strong> sitemaps.
							</xsl:when>
							<xsl:otherwise>
								This sitemap contains <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> URLs.
							</xsl:otherwise>
						</xsl:choose>
					</div>
				</div>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
