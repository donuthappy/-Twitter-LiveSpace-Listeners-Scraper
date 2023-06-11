from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import pandas as pd

print("Loading all Ryan Carson Followers----")
# file_path = 'Data/ryan-carson-followers-124494.json'
file_path = 'Data/ryan-carson-followers-28568.json'

data_txt = None
data_json = pd.read_json(file_path, encoding='utf-8')

#Set up the webdriver
options = Options()
# options.add_argument("--headless")
options.add_argument("--window-size=1920, 1200")
options.add_experimental_option("excludeSwitches", ['enable-automation'])
# driver = webdriver.Chrome(service_args=['--executable-path=path/to/chromedriver'])
driver = webdriver.Chrome(options=options)

valid_listeners_file_path = 'Data/Valid-listeners-List.json'

cnt = 0
valid = 0
for person in data_json.iterrows():
  cnt += 1
  position = person[0]
  pro_url = person[1]['profile_url']
  username = person[1]['username']
  print(pro_url)
  driver.get(pro_url)
  
  wait = WebDriverWait(driver, 10)
  tweet_elem_xpath = '//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div/div/div[3]/div/div/section/div/div'
  try :
    wait.until(EC.presence_of_element_located((By.XPATH, tweet_elem_xpath)))
    tweet_elem = driver.find_element(By.XPATH, tweet_elem_xpath)
    children_tweet_elem = tweet_elem.find_elements(By.XPATH, "./child::*")
    for elem in children_tweet_elem:
      item_tweet_txt = elem.text.lower()
      if item_tweet_txt.find('daily dose') != -1 or item_tweet_txt.find('#dailydose') != -1 or item_tweet_txt.find('ryan carson') != -1 or item_tweet_txt.find('ryancarson') != -1:
        valid += 1
        valid_listeners_json = pd.read_json(valid_listeners_file_path, encoding='utf-8')
        valid_listeners_json.loc[len(valid_listeners_json), ['profile_url', 'username']] = pro_url, username
        
        valid_listeners_json.to_json(valid_listeners_file_path, orient='records')

        print("Valid Users : ", valid)
        break
  except :
    print("Access Error")
  print("Number of Checked Followers : ", cnt)
  #   break
# hlist = ["profile_url", "profile_name", "username", "joindate", "location", "Tweets", "followers", "following", "verified_blue_badge", "AccountVerified", "favourites_count", "profile_image_url", "profile_banner", "profile_attached_link", "description"]
driver.quit()

df = open(valid_listeners_file_path, 'r', encoding='utf-8')
dt = df.read()
df.close()
rt = dt.replace('\/', '/')
df = open(valid_listeners_file_path, 'w', encoding='utf-8')
df.write(rt)
df.close()
