all:
	sudo docker-compose up

nest:
	npx prisma migrate dev --name init
	npm run seed
	npm run start:dev

clean:
	sudo docker-compose down

fclean: clean
	sudo docker system prune -af
	sudo rm -rf db

re: fclean all

.PHONY: all nest clean fclean re