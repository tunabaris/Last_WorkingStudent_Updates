import csv
import re
import sys
import io
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

def parse_date(date_str):
    if date_str == "N/A" or not date_str:
        return datetime.min
    date_str = date_str.strip()
    # Try various date formats common on job boards
    formats = ["%b %d, %Y", "%B %d, %Y", "%d %b %Y", "%d.%m.%Y", "%m/%d/%Y", "%Y-%m-%d"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            pass
    return datetime.min

def extract_job_details(page, url):
    """
    Belirtilen iş ilanı sayfasına giderek detayları çeker.
    """
    try:
        # Sayfanın yüklenmesini bekle, çok uzun sürerse timeout'a düşer (60 saniye)
        page.goto(url, wait_until='domcontentloaded', timeout=60000)
        # Dinamik javascript içeriklerinin render olabilmesi için kısa bir bekleme
        page.wait_for_timeout(2000) 
        
        try:
            body_text = page.locator('body').inner_text()
        except:
            body_text = ""
        
        # 1. İlan Başlığı (Job Title)
        try:
            # SAP kariyer sayfasında genelde başlık h1 etiketi içindedir
            title_locator = page.locator('h1')
            if title_locator.count() > 0:
                title = title_locator.first.inner_text().strip()
            else:
                title = "N/A"
        except:
            title = "N/A"
            
        # 2. Yayınlanma Tarihi (Date Posted)
        try:
            # Date Posted genelde özel bir attribute veya metin ile bulunur
            date_locator = page.locator('span[data-customview="datePosted"], p:has-text("Date:"), span:has-text("Date:"), span.jobDate, time')
            if date_locator.count() > 0:
                date_posted = date_locator.first.inner_text().strip()
                # Baştaki "Date:" gibi gereksiz metinleri temizle
                date_posted = re.sub(r'^(Date|Date Posted):\s*', '', date_posted, flags=re.IGNORECASE)
            else:
                date_posted = "N/A"
        except:
            date_posted = "N/A"
            
        if date_posted == "N/A" and body_text:
            match = re.search(r'Posted Date\s*\n\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})', body_text)
            if match:
                date_posted = match.group(1).strip()
            
        # 3. Lokasyon (Location)
        try:
            loc_locator = page.locator('span.jobGeoLocation, span[data-customview="location"]')
            if loc_locator.count() > 0:
                location = loc_locator.first.inner_text().strip()
            else:
                location = "N/A"
        except:
            location = "N/A"
            
        # 4. Departman (Department)
        try:
            dept_locator = page.locator('span.department, span:has-text("Department:")')
            if dept_locator.count() > 0:
                department = dept_locator.first.inner_text().strip()
                department = re.sub(r'^Department:\s*', '', department, flags=re.IGNORECASE)
            else:
                department = "N/A"
        except:
            department = "N/A"
            
        # 5. Dil Gereksinimi (Tüm sayfa metni üzerinden regex ile analiz)
        try:
            languages = []
            # İngilizce gereksinimi kontrolü
            if re.search(r'(fluent|excellent|good|proficient|strong|business).*english', body_text, re.IGNORECASE) or \
               re.search(r'english.*(fluent|excellent|good|proficient|strong|business)', body_text, re.IGNORECASE):
                languages.append('English')
                
            # Almanca gereksinimi kontrolü
            # Check if German is mentioned as optional / a plus
            german_optional_pattern = r'(german\s*(?:as\s*a|is\s*a|is\s*an)?\s*(?:plus|advantage|asset|nice\s*to\s*have))|((?:plus|advantage|asset|nice\s*to\s*have)\s*(?::|is)?\s*german)'
            is_german_optional = re.search(german_optional_pattern, body_text, re.IGNORECASE)
            
            # Check if German is mentioned as a requirement
            is_german_required = re.search(r'(fluent|excellent|good|proficient|strong|business).*german', body_text, re.IGNORECASE) or \
                                 re.search(r'german.*(fluent|excellent|good|proficient|strong|business)', body_text, re.IGNORECASE)
            
            if is_german_required and not is_german_optional:
                languages.append('German')
                
            language_req = ", ".join(languages) if languages else "Not specified"
        except:
            language_req = "N/A"
            
        return {
            "title": title,
            "date": date_posted,
            "location": location,
            "department": department,
            "language": language_req,
            "link": url,
            "body_text": body_text
        }
    except Exception as e:
        print(f"Sayfa detayları çekilirken hata oluştu ({url}): {e}")
        return None

def main():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    print("SAP Job Scraper başlatılıyor...")
    
    with sync_playwright() as p:
        # Tarayıcıyı başlatıyoruz. Ekranda tarayıcıyı görmek isterseniz headless=False yapabilirsiniz.
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        base_url = "https://jobs.sap.com/search/?q=Working+student&optionsFacetsDD_country=DE&startrow={}&scrollToTable=true"
        all_job_links = []
        
        print("\n--- Adım 1: Arama sonuçlarındaki ilan linkleri toplanıyor ---")
        
        for startrow in range(0, 76, 25): # 0, 25, 50, 75
            url = base_url.format(startrow)
            print(f"Sayfa taranıyor: {url}")
            
            try:
                page.goto(url, wait_until='domcontentloaded', timeout=60000)
                page.wait_for_timeout(5000) # İlanların Javascript ile DOM'a yerleşmesini bekle
                
                # İlan linklerini topla. SAP sitesinde ilan linkleri genelde "a.jobTitle-link" class'ına sahiptir.
                links = page.locator('a.jobTitle-link').evaluate_all('elements => elements.map(e => e.href)')
                
                if not links:
                    print("İlan bulunamadı.")
                else:
                    all_job_links.extend(links)
                    
            except PlaywrightTimeoutError:
                print(f"Sayfa yüklenirken zaman aşımı oldu: {url}")
            except Exception as e:
                print(f"Linkler toplanırken beklenmedik bir hata oluştu: {e}")
                
        # Olası tekrarlı çekimleri önlemek için linkleri benzersiz (unique) hale getiriyoruz
        all_job_links = list(set(all_job_links))
        print(f"Toplam {len(all_job_links)} benzersiz ilan linki bulundu.")
        
        print("\n--- Adım 2: İlan detayları çekiliyor ve filtreleniyor ---")
        filtered_jobs = []
        
        for i, link in enumerate(all_job_links, 1):
            print(f"[{i}/{len(all_job_links)}] İnceleniyor...")
            details = extract_job_details(page, link)
            
            if not details:
                continue
                
            # Filtreleme kaldırıldı, tüm ilanlar ekleniyor
            filtered_jobs.append(details)
            print(f"  -> EKLENDİ: {details['title']} | Tarih: {details['date']}")
            
        # Sonuçları yayınlanma tarihine göre (en yeni en üstte olacak şekilde) sıralama
        filtered_jobs.sort(key=lambda x: parse_date(x['date']), reverse=True)
                
        # Bulunan sonuçları CSV dosyasına yazdırma
        print("\n--- Adım 3: Sonuçlar CSV dosyasına kaydediliyor ---")
        output_file = "ui/public/sap_filtered_jobs.csv"
        try:
            with open(output_file, "w", newline='', encoding="utf-8") as f:
                writer = csv.writer(f)
                # İstenilen formatta sütun başlıkları
                writer.writerow(["Job Title", "Date Posted", "Location", "Department", "Language Req", "Direct Link"])
                for job in filtered_jobs:
                    writer.writerow([
                        job['title'], 
                        job['date'], 
                        job['location'], 
                        job['department'],
                        job['language'], 
                        job['link']
                    ])
            print(f"İşlem başarıyla tamamlandı! Kriterlere uyan {len(filtered_jobs)} adet ilan '{output_file}' dosyasına kaydedildi.")
        except Exception as e:
            print(f"Dosya kaydedilirken hata oluştu: {e}")
            
        # İşimiz bitince tarayıcıyı kapatıyoruz
        browser.close()

if __name__ == "__main__":
    main()
