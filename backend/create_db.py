import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='Adi@4425'
    )
    cursor = connection.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS academiq;")
    connection.commit()
    print("Database academiq ensured.")
except Exception as e:
    print("Error ensuring database:", e)
finally:
    if 'connection' in locals() and connection.open:
        cursor.close()
        connection.close()
