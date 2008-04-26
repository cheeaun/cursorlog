#!/usr/bin/env python

import wsgiref.handlers
import os

from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template

class CursorEvents(db.Model):
	id = db.IntegerProperty()
	event = db.TextProperty(required=True)
	when = db.DateTimeProperty(auto_now_add=True)
	ipaddr = db.StringProperty()
	duration = db.IntegerProperty()

class MainHandler(webapp.RequestHandler):
	def get(self):
		limit = 50
		nologrq = self.request.get('nolog')
		delete = self.request.get('delete')
		nolog = 'true' if nologrq else 'false'
		
		cursorEvents = db.GqlQuery('SELECT * FROM CursorEvents ORDER by when DESC')
		cursorEvents.fetch(limit)
		
		ipaddr = os.environ['REMOTE_ADDR']
		
		if delete:
			for e in cursorEvents:
				e.delete()

		values = {
			'cursorEvents': cursorEvents,
			'limit': limit,
			'ipaddr': ipaddr,
			'nolog': nolog
		}
		self.response.out.write(template.render("main.html", values))
	
	def post(self):
		e = self.request.get('e')
		d = self.request.get('d')
		if d: d = int(d)
		ip = os.environ['REMOTE_ADDR']
		if e:
			cursorEvents = CursorEvents(
				event=e,
				ipaddr=ip,
				duration=d
			)
			cursorEvents.put();
			cursorEvents.id=cursorEvents.key().id()
			cursorEvents.put();
			self.response.out.write(str(cursorEvents.is_saved()))
			
class PlayHandler(webapp.RequestHandler):
	def get(self):
		id = self.request.get('id')
		if id:
			cursorEvents = db.GqlQuery('SELECT * FROM CursorEvents WHERE id = :1', int(id))
			try:
				self.response.out.write(cursorEvents[0].event)
			except IndexError:
				self.response.out.write('Error')

def main():
	application = webapp.WSGIApplication([
		('/', MainHandler),
		('/play', PlayHandler)
	], debug=True)
	wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
	main()
